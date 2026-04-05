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
  const { propertyId: pid } = await params;
  const propertyId = Number(pid);
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

  // Events from OTHER platforms (not the one we're generating for)
  const sourcePlatforms = links
    .filter((l) => l.platform !== forPlatform)
    .map((l) => l.platform);

  // If no other platforms configured, also include events from same platform
  // (in case user has manual blocks or wants to merge all)
  const platformFilter = sourcePlatforms.length > 0 ? sourcePlatforms : undefined;

  const events = await prisma.calendarEvent.findMany({
    where: {
      propertyId,
      ...(platformFilter && { platform: { in: platformFilter } }),
      // Only future events
      endDate: { gte: new Date().toISOString().substring(0, 10) },
    },
    orderBy: { startDate: "asc" },
  });

  // Also include reservations from the database (manually added ones)
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      checkOut: { gte: new Date() },
      // Include reservations from the OTHER platform
      ...(sourcePlatforms.length > 0 && { platform: { in: sourcePlatforms } }),
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

  // Deduplicate by date range (avoid double-blocking same dates)
  const seen = new Set<string>();
  const unique = icalEvents.filter((e) => {
    const key = `${e.startDate}-${e.endDate}`;
    if (seen.has(key)) return false;
    seen.add(key);
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
    `${property.name} — Blocked for ${forPlatform}`
  );

  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${property.name}-${forPlatform}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
