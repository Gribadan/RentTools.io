import { prisma } from "@/lib/prisma";
import { generateICal, generateBufferedEvents, generateBufferOnlyEvents, addDays, type ICalEvent } from "@/lib/ical";

/**
 * Generate an iCal feed for a property+platform.
 * Single source of truth — used by all feed routes.
 */
export async function generateFeed(propertyId: number, forPlatform: string): Promise<{ ical: string } | { error: string; status: number }> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { name: true, minNights: true },
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
  const openOverrides = new Set(dateOverrides.filter(o => o.type === "open").map(o => o.date));
  const closedOverrides = dateOverrides.filter(o => o.type === "closed");

  // All events for buffer calculation
  const allEvents = await prisma.calendarEvent.findMany({
    where: { propertyId, endDate: { gte: new Date().toISOString().substring(0, 10) } },
    orderBy: { startDate: "asc" },
  });

  const allReservations = await prisma.reservation.findMany({
    where: { propertyId, checkOut: { gte: new Date() } },
    orderBy: { checkIn: "asc" },
  });

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
