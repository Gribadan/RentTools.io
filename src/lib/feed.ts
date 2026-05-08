import { prisma } from "@/lib/prisma";
import { generateICal, generateBufferedEvents, generateBufferOnlyEvents, addDays, type ICalEvent } from "@/lib/ical";

export { parseFeedFilename } from "@/lib/feed-utils";

/**
 * Empty-but-RFC-valid iCal — served at the onboarding-draft slug before
 * the user signs up so anything they paste into Airbnb / Booking still
 * returns a 200 with valid calendar content. generateICal already emits
 * a single past-dated placeholder VEVENT when given an empty events array
 * (some platforms reject 0-event feeds), so this is just a wrapper.
 */
export function generateEmptyFeed(calendarName: string = "RentTools placeholder"): string {
  return generateICal([], calendarName);
}

/**
 * Generate an iCal feed for a property+platform.
 * Single source of truth — used by all feed routes.
 */
export async function generateFeed(propertyId: number, forPlatform: string): Promise<{ ical: string } | { error: string; status: number }> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { name: true, minNights: true, bookingWindow: true },
  });

  if (!property) {
    return { error: "Property not found", status: 404 };
  }

  const links = await prisma.calendarLink.findMany({
    where: { propertyId },
  });

  // Date overrides
  const dateOverrides = await prisma.dateOverride.findMany({
    where: { propertyId },
  });
  const closedOverrides = dateOverrides.filter(o => o.type === "closed");
  // Effective open overrides exclude any date now covered by a reservation
  // — a host who marked 21-24 May as 'open' and then created a manual
  // reservation on those same dates expects the reservation to win.
  // Without this guard, the override-removal pass below would strip the
  // reservation out of the feed, double-exposing those dates on Airbnb /
  // Booking. Resolved here at read time so the data layer's existing
  // override row stays intact (the host can still un-mark the dates as
  // 'open' explicitly).
  const reservationCoveredDates = new Set<string>();

  // Booking window cutoff — ignore events starting beyond this date
  const windowDays = property.bookingWindow ?? 365;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + windowDays);
  const cutoff = cutoffDate.toISOString().substring(0, 10);

  // All events for buffer calculation (within booking window)
  const allEvents = await prisma.calendarEvent.findMany({
    where: {
      propertyId,
      endDate: { gte: new Date().toISOString().substring(0, 10) },
      startDate: { lt: cutoff },
    },
    orderBy: { startDate: "asc" },
  });

  const allReservations = await prisma.reservation.findMany({
    where: { propertyId, checkOut: { gte: new Date() } },
    orderBy: { checkIn: "asc" },
  });

  // Walk every reservation and every synced calendar event, marking
  // every covered date in `reservationCoveredDates`. The override-removal
  // pass below will exclude these from the open-overrides set so a
  // reservation always wins.
  for (const r of allReservations) {
    let d = new Date(r.checkIn).toISOString().substring(0, 10);
    const end = new Date(r.checkOut).toISOString().substring(0, 10);
    while (d < end) {
      reservationCoveredDates.add(d);
      d = addDays(d, 1);
    }
  }
  for (const e of allEvents) {
    let d = e.startDate;
    while (d < e.endDate) {
      reservationCoveredDates.add(d);
      d = addDays(d, 1);
    }
  }

  // Open-override set used for the feed-strip pass: any date covered
  // by a reservation or synced event is silently dropped from the
  // override (the data row stays — only the in-memory effective set
  // is filtered).
  const openOverrides = new Set(
    dateOverrides
      .filter((o) => o.type === "open" && !reservationCoveredDates.has(o.date))
      .map((o) => o.date),
  );

  const targetLink = links.find((l) => l.platform === forPlatform);
  const bufferBefore = targetLink?.bufferBefore ?? 1;
  const bufferAfter = targetLink?.bufferAfter ?? 1;

  // Other-platform events (block dates + buffer)
  const otherEvents: ICalEvent[] = allEvents
    .filter(e => e.platform !== forPlatform)
    .map(e => ({ uid: e.uid, summary: e.summary || "Blocked", startDate: e.startDate, endDate: e.endDate }));

  for (const res of allReservations.filter(r => (r.platform || "airbnb") !== forPlatform)) {
    otherEvents.push({
      uid: `renttool-reservation-${res.id}`,
      summary: `${res.name} (${res.platform})`,
      startDate: new Date(res.checkIn).toISOString().substring(0, 10),
      endDate: new Date(res.checkOut).toISOString().substring(0, 10),
    });
  }

  // Same-platform events (buffer-only)
  const sameEvents: ICalEvent[] = allEvents
    .filter(e => e.platform === forPlatform)
    .map(e => ({ uid: `own-${e.uid}`, summary: "Buffer", startDate: e.startDate, endDate: e.endDate }));

  for (const res of allReservations.filter(r => (r.platform || "airbnb") === forPlatform)) {
    sameEvents.push({
      uid: `own-res-${res.id}`,
      summary: "Buffer",
      startDate: new Date(res.checkIn).toISOString().substring(0, 10),
      endDate: new Date(res.checkOut).toISOString().substring(0, 10),
    });
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = otherEvents.filter(e => { if (seen.has(e.uid)) return false; seen.add(e.uid); return true; });

  // Generate buffered events
  const bufferedOther = generateBufferedEvents(unique, bufferBefore, bufferAfter, "sync", property.minNights ?? 3);
  const bufferOwn = generateBufferOnlyEvents(sameEvents, bufferBefore, bufferAfter, "Blocked (cleaning)");

  // Combine and deduplicate by date range
  const seenDates = new Set<string>();
  const buffered = [...bufferedOther, ...bufferOwn].filter(e => {
    const key = `${e.startDate}-${e.endDate}`;
    if (seenDates.has(key)) return false;
    seenDates.add(key);
    return true;
  });

  // Apply date overrides — remove/split events covering force-opened dates
  let finalEvents = buffered;

  if (openOverrides.size > 0) {
    const expanded: ICalEvent[] = [];
    for (const ev of finalEvents) {
      const overridesInRange: string[] = [];
      let d = ev.startDate;
      while (d < ev.endDate) {
        if (openOverrides.has(d)) overridesInRange.push(d);
        d = addDays(d, 1);
      }

      if (overridesInRange.length === 0) {
        expanded.push(ev);
        continue;
      }

      let segStart = ev.startDate;
      for (const openDate of overridesInRange.sort()) {
        if (segStart < openDate) {
          expanded.push({
            uid: `${ev.uid}-before-${openDate}`,
            summary: ev.summary,
            startDate: segStart,
            endDate: openDate,
          });
        }
        segStart = addDays(openDate, 1);
      }
      if (segStart < ev.endDate) {
        expanded.push({
          uid: `${ev.uid}-after-${overridesInRange[overridesInRange.length - 1]}`,
          summary: ev.summary,
          startDate: segStart,
          endDate: ev.endDate,
        });
      }
    }
    finalEvents = expanded;
  }

  // Add force-closed dates as blocked events
  for (const override of closedOverrides) {
    finalEvents.push({
      uid: `renttool-override-closed-${override.date}`,
      summary: "Blocked (manual)",
      startDate: override.date,
      endDate: addDays(override.date, 1),
    });
  }

  const ical = generateICal(finalEvents, `RentTool - Blocked for ${forPlatform}`);
  return { ical };
}
