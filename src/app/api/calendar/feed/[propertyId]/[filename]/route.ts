import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateICal, generateBufferedEvents, generateBufferOnlyEvents, type ICalEvent } from "@/lib/ical";

/**
 * GET /api/calendar/feed/[propertyId]/for-airbnb.ics
 * GET /api/calendar/feed/[propertyId]/for-booking.ics
 *
 * Clean .ics URL format that Airbnb/Booking accept (no query params).
 * Filename format: for-{platform}.ics
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ propertyId: string; filename: string }> }
) {
  try {
  const { propertyId: pid, filename } = await params;
  const propertyId = Number(pid);

  // Parse platform from filename: "for-airbnb.ics" -> "airbnb"
  const match = filename.match(/^for-(\w+)\.ics$/i);
  const forPlatform = match?.[1] || "airbnb";

  if (isNaN(propertyId)) {
    return new NextResponse("Invalid property ID", { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { name: true, minNights: true },
  });

  if (!property) {
    return new NextResponse("Property not found", { status: 404 });
  }

  const links = await prisma.calendarLink.findMany({
    where: { propertyId },
  });

  // Get ALL events (both platforms) for buffer calculation
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

  // Deduplicate other events
  const seen = new Set<string>();
  const unique = otherEvents.filter(e => { if (seen.has(e.uid)) return false; seen.add(e.uid); return true; });

  // 1. Buffered other-platform events
  const bufferedOther = generateBufferedEvents(unique, bufferBefore, bufferAfter, "sync", property.minNights ?? 3);

  // 2. Buffer-only for same-platform events
  const bufferOwn = generateBufferOnlyEvents(sameEvents, bufferBefore, bufferAfter, "Blocked (cleaning)");

  // 3. Combine and deduplicate
  const seenDates = new Set<string>();
  const buffered = [...bufferedOther, ...bufferOwn].filter(e => {
    const key = `${e.startDate}-${e.endDate}`;
    if (seenDates.has(key)) return false;
    seenDates.add(key);
    return true;
  });

  const ical = generateICal(
    buffered,
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
