import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateICal, generateBufferedEvents, generateBufferOnlyEvents, addDays, type ICalEvent } from "@/lib/ical";

/**
 * GET /api/calendar/feed/[propertyId]?for=airbnb
 * GET /api/calendar/feed/[propertyId]?for=booking
 *
 * Generates an iCal feed for import into a platform.
 * The feed contains blocked dates from the OTHER platform(s) + buffer days.
 *
 * Example: ?for=airbnb returns events from Booking + buffers → Airbnb imports this
 *          ?for=booking returns events from Airbnb + buffers → Booking imports this
 *
 * This endpoint is PUBLIC (no auth) so that Airbnb/Booking can fetch it.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
  const { propertyId: pid } = await params;
  // Support .ics suffix: "123.ics" -> 123
  const propertyId = Number(pid.replace(/\.ics$/i, ""));
  const forPlatform = request.nextUrl.searchParams.get("for") || "airbnb";

  if (isNaN(propertyId)) {
    return new NextResponse("Invalid property ID", { status: 400 });
  }

  // Get property name
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { name: true, minNights: true },
  });

  if (!property) {
    return new NextResponse("Property not found", { status: 404 });
  }

  // Get calendar links for this property to know buffer settings
  const links = await prisma.calendarLink.findMany({
    where: { propertyId },
  });

  // Get date overrides
  const dateOverrides = await prisma.dateOverride.findMany({
    where: { propertyId },
  });
  const openOverrides = new Set(dateOverrides.filter(o => o.type === "open").map(o => o.date));
  const closedOverrides = dateOverrides.filter(o => o.type === "closed");

  // Get ALL events for this property (both platforms) — needed for buffer calculation
  const allEvents = await prisma.calendarEvent.findMany({
    where: {
      propertyId,
      endDate: { gte: new Date().toISOString().substring(0, 10) },
    },
    orderBy: { startDate: "asc" },
  });

  // Get ALL reservations
  const allReservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      checkOut: { gte: new Date() },
    },
    orderBy: { checkIn: "asc" },
  });

  const targetLink = links.find((l) => l.platform === forPlatform);
  const bufferBefore = targetLink?.bufferBefore ?? 1;
  const bufferAfter = targetLink?.bufferAfter ?? 1;

  // Split into: other-platform events (block dates) and same-platform (buffer-only)
  const otherPlatformEvents: ICalEvent[] = allEvents
    .filter(e => e.platform !== forPlatform)
    .map(e => ({ uid: e.uid, summary: e.summary || "Blocked", startDate: e.startDate, endDate: e.endDate }));

  // Other-platform reservations
  for (const res of allReservations.filter(r => (r.platform || "airbnb") !== forPlatform)) {
    const checkIn = new Date(res.checkIn).toISOString().substring(0, 10);
    const checkOut = new Date(res.checkOut).toISOString().substring(0, 10);
    otherPlatformEvents.push({
      uid: `renttool-reservation-${res.id}`,
      summary: `${res.name} (${res.platform})`,
      startDate: checkIn,
      endDate: checkOut,
    });
  }

  // Same-platform events — we only need these for generating buffer days
  const samePlatformEvents: ICalEvent[] = allEvents
    .filter(e => e.platform === forPlatform)
    .map(e => ({ uid: `own-${e.uid}`, summary: "Buffer", startDate: e.startDate, endDate: e.endDate }));

  for (const res of allReservations.filter(r => (r.platform || "airbnb") === forPlatform)) {
    const checkIn = new Date(res.checkIn).toISOString().substring(0, 10);
    const checkOut = new Date(res.checkOut).toISOString().substring(0, 10);
    samePlatformEvents.push({
      uid: `own-res-${res.id}`,
      summary: "Buffer",
      startDate: checkIn,
      endDate: checkOut,
    });
  }

  // Combine: other-platform events go in full, same-platform only for buffer generation
  const icalEvents: ICalEvent[] = [...otherPlatformEvents];

  // Deduplicate by UID
  const seen = new Set<string>();
  const unique = icalEvents.filter((e) => {
    if (seen.has(e.uid)) return false;
    seen.add(e.uid);
    return true;
  });

  // 1. Generate buffered events from OTHER-platform bookings (booking + buffer)
  const bufferedOther = generateBufferedEvents(
    unique,
    bufferBefore,
    bufferAfter,
    "sync",
    property.minNights ?? 3
  );

  // 2. Generate buffer-ONLY events from SAME-platform bookings (just cleaning days)
  const bufferOwn = generateBufferOnlyEvents(
    samePlatformEvents,
    bufferBefore,
    bufferAfter,
    "Blocked (cleaning)"
  );

  // 3. Combine and deduplicate by date range
  const allBlocked = [...bufferedOther, ...bufferOwn];
  const seenDates = new Set<string>();
  const buffered = allBlocked.filter((e) => {
    const key = `${e.startDate}-${e.endDate}`;
    if (seenDates.has(key)) return false;
    seenDates.add(key);
    return true;
  });

  // Apply date overrides to the feed
  // 1. Remove/split events that cover force-opened dates
  let finalEvents = buffered;

  if (openOverrides.size > 0) {
    const expanded: ICalEvent[] = [];
    for (const ev of finalEvents) {
      // Check if any open override falls within this event's date range
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

      // Split the event around the open overrides
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

  // 2. Add force-closed dates as blocked events
  for (const override of closedOverrides) {
    finalEvents.push({
      uid: `renttool-override-closed-${override.date}`,
      summary: "Blocked (manual)",
      startDate: override.date,
      endDate: addDays(override.date, 1), // iCal exclusive end
    });
  }

  // Generate iCal
  const ical = generateICal(
    finalEvents,
    `RentTool - Blocked for ${forPlatform}`
  );

  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="calendar-${forPlatform}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
  } catch (err) {
    console.error("Feed error:", err);
    return new NextResponse(`Error: ${err instanceof Error ? err.message : String(err)}`, { status: 500 });
  }
}
