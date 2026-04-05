import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateICal, generateBufferedEvents, type ICalEvent } from "@/lib/ical";

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
    select: { name: true },
  });

  if (!property) {
    return new NextResponse("Property not found", { status: 404 });
  }

  const links = await prisma.calendarLink.findMany({
    where: { propertyId },
  });

  const sourcePlatforms = links
    .filter((l) => l.platform !== forPlatform)
    .map((l) => l.platform);

  const platformFilter = sourcePlatforms.length > 0 ? sourcePlatforms : undefined;

  const events = await prisma.calendarEvent.findMany({
    where: {
      propertyId,
      ...(platformFilter && { platform: { in: platformFilter } }),
      endDate: { gte: new Date().toISOString().substring(0, 10) },
    },
    orderBy: { startDate: "asc" },
  });

  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      checkOut: { gte: new Date() },
      ...(sourcePlatforms.length > 0 && { platform: { in: sourcePlatforms } }),
    },
    orderBy: { checkIn: "asc" },
  });

  const targetLink = links.find((l) => l.platform === forPlatform);
  const bufferBefore = targetLink?.bufferBefore ?? 1;
  const bufferAfter = targetLink?.bufferAfter ?? 1;

  const icalEvents: ICalEvent[] = events.map((e) => ({
    uid: e.uid,
    summary: e.summary || "Blocked",
    startDate: e.startDate,
    endDate: e.endDate,
  }));

  for (const res of reservations) {
    const checkIn = new Date(res.checkIn).toISOString().substring(0, 10);
    const checkOut = new Date(res.checkOut).toISOString().substring(0, 10);
    icalEvents.push({
      uid: `renttool-reservation-${res.id}`,
      summary: `${res.name} (${res.platform})`,
      startDate: checkIn,
      endDate: checkOut,
    });
  }

  const seen = new Set<string>();
  const unique = icalEvents.filter((e) => {
    const key = `${e.startDate}-${e.endDate}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const buffered = generateBufferedEvents(
    unique,
    bufferBefore,
    bufferAfter,
    sourcePlatforms.join("+") || "manual"
  );

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
