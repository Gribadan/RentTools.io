import { prisma } from "@/lib/prisma";
import { generateICal, generateBufferedEvents, generateBufferOnlyEvents, addDays, type ICalEvent } from "@/lib/ical";
import { createHash } from "node:crypto";

export { parseFeedFilename } from "@/lib/feed-utils";

/** Actual inventory channel for feed routing. The migration rewrites durable
 *  extension rows to platform=direct; checking the explicit role as well keeps
 *  an in-flight/legacy row safe if it is read before that backfill completes. */
function reservationChannel(reservation: {
  platform: string | null;
  linkedEventRole?: string | null;
}): string {
  if (reservation.linkedEventRole === "extension") return "direct";
  return reservation.platform || "airbnb";
}

/**
 * Public iCal feeds are bearer-readable. Keep their VEVENT identifiers stable
 * without exposing an imported platform UID or an internal database ID.
 */
function opaqueEventUid(...parts: Array<string | number | null | undefined>): string {
  const digest = createHash("sha256")
    .update(parts.map((part) => String(part ?? "")).join("\u001f"))
    .digest("hex")
    .slice(0, 32);
  // The `renttool-` prefix is load-bearing, not cosmetic. calendar-sync.ts
  // drops inbound events whose UID starts with it, and that filter is what
  // stops our own buffer blocks from being re-imported and re-exported in an
  // ever-widening loop whenever a feed round-trips back to us (self-import, a
  // second RentTools property, or a pass-through hub such as a subscribed
  // Google Calendar). The digest still hides the source UID, the reservation
  // ID and the guest name, so keeping the prefix costs nothing in privacy.
  return `renttool-${digest}`;
}

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
    // Imported summaries commonly contain guest names. Public iCal URLs are
    // bearer links, so outgoing feeds must expose inventory only, never PII.
    .map(e => ({
      uid: opaqueEventUid("calendar-event", propertyId, e.platform, e.uid),
      summary: "Blocked",
      startDate: e.startDate,
      endDate: e.endDate,
    }));

  for (const res of allReservations) {
    const event: ICalEvent = {
      uid: opaqueEventUid("reservation", propertyId, res.id),
      summary: "Blocked",
      startDate: new Date(res.checkIn).toISOString().substring(0, 10),
      endDate: new Date(res.checkOut).toISOString().substring(0, 10),
    };

    // The booking channel is a label, not proof that its platform still
    // holds these nights. An unlinked Airbnb-labelled local reservation
    // used to disappear from Airbnb's feed while still blocking Booking.
    // Only an explicit link proves the reservation is a claim of the target's
    // source event. An unrelated native block on the same dates (including a
    // host's emergency manual reclose) must not suppress local occupancy.
    // Suppress only that linked source's nights; all remaining local nights
    // must keep blocking the target as well.
    // Subtraction also preserves a host's added nights around a source stay.
    let segments = [event];
    if (reservationChannel(res) === forPlatform && res.linkedEventUid &&
        (res.linkedEventPlatform || res.platform) === forPlatform) {
      for (const source of allEvents.filter(e => e.platform === forPlatform && e.uid === res.linkedEventUid)) {
        segments = segments.flatMap((segment) => {
          if (source.endDate <= segment.startDate || source.startDate >= segment.endDate) {
            return [segment];
          }
          const remaining: ICalEvent[] = [];
          if (segment.startDate < source.startDate) {
            remaining.push({ ...segment, endDate: source.startDate });
          }
          if (source.endDate < segment.endDate) {
            remaining.push({ ...segment, startDate: source.endDate });
          }
          return remaining;
        });
      }
    }
    otherEvents.push(...segments.map((segment) => ({
      ...segment,
      uid: opaqueEventUid("reservation-segment", propertyId, res.id, segment.startDate, segment.endDate),
    })));
  }

  // Same-platform events (buffer-only)
  const sameEvents: ICalEvent[] = allEvents
    .filter(e => e.platform === forPlatform)
    .map(e => ({
      uid: opaqueEventUid("same-platform-event", propertyId, e.platform, e.uid),
      summary: "Buffer",
      startDate: e.startDate,
      endDate: e.endDate,
    }));

  for (const res of allReservations.filter(r => reservationChannel(r) === forPlatform)) {
    sameEvents.push({
      uid: opaqueEventUid("same-platform-reservation", propertyId, res.id),
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

  // The buffer/merge helpers intentionally rebuild UIDs from their inputs.
  // Re-key the final public events once more so neither dates, source UIDs nor
  // internal IDs leak through the bearer-readable feed. The date range is part
  // of the hash input, keeping the opaque identifier stable across refreshes.
  // A manual closed date can exactly match an existing one-night stay or
  // cleaning block. Deduplicate after overrides too, or the range-based
  // public UID below would occur twice and invalidate the feed.
  const finalRanges = new Map(finalEvents.map((event) => [`${event.startDate}/${event.endDate}`, event]));
  const publicEvents = [...finalRanges.values()].map((event) => ({
    ...event,
    uid: opaqueEventUid("feed-event", propertyId, forPlatform, event.startDate, event.endDate),
    summary: "Blocked",
  }));

  const ical = generateICal(publicEvents, `RentTool - Blocked for ${forPlatform}`);
  return { ical };
}
