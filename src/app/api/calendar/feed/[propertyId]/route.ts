import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateICal, generateBufferedEvents, type ICalEvent } from "@/lib/ical";

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
    select: { name: true },
  });

  if (!property) {
    return new NextResponse("Property not found", { status: 404 });
  }

  // Get calendar links for this property to know buffer settings
  const links = await prisma.calendarLink.findMany({
    where: { propertyId },
  });

  // Events from OTHER platforms only — never feed a platform its own events back
  const events = await prisma.calendarEvent.findMany({
    where: {
      propertyId,
      platform: { not: forPlatform },
      endDate: { gte: new Date().toISOString().substring(0, 10) },
    },
    orderBy: { startDate: "asc" },
  });

  const sourcePlatforms = links
    .filter((l) => l.platform !== forPlatform)
    .map((l) => l.platform);

  // Also include reservations from the database (manually added ones)
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      checkOut: { gte: new Date() },
      // Only reservations from OTHER platforms
      platform: { not: forPlatform },
    },
    orderBy: { checkIn: "asc" },
  });

  // Determine buffer days — use the settings from the target platform's link
  const targetLink = links.find((l) => l.platform === forPlatform);
  const bufferBefore = targetLink?.bufferBefore ?? 1;
  const bufferAfter = targetLink?.bufferAfter ?? 1;

  // Convert DB events to ICalEvent format
  const icalEvents: ICalEvent[] = events.map((e) => ({
    uid: e.uid,
    summary: e.summary || "Blocked",
    startDate: e.startDate,
    endDate: e.endDate,
  }));

  // Also add manual reservations
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

  // Deduplicate by UID (avoid double-blocking same event)
  const seen = new Set<string>();
  const unique = icalEvents.filter((e) => {
    if (seen.has(e.uid)) return false;
    seen.add(e.uid);
    return true;
  });

  // Generate buffered events
  const buffered = generateBufferedEvents(
    unique,
    bufferBefore,
    bufferAfter,
    sourcePlatforms.join("+") || "manual"
  );

  // Generate iCal
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
