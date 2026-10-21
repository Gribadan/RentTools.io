import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAccessiblePropertyIds } from "@/lib/ownership";
import { calendarOverviewMonth, type CalendarOverviewResponse } from "@/lib/calendar-overview";
import { toReservationDateInput } from "@/lib/reservation-dates";

const reservationSelect = {
  id: true, propertyId: true, name: true, checkIn: true, checkOut: true,
  platform: true, linkedEventUid: true, linkedEventPlatform: true, linkedEventRole: true,
} as const;
const eventSelect = {
  propertyId: true, platform: true, uid: true, summary: true, startDate: true, endDate: true,
} as const;
const responseHeaders = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: responseHeaders });
    const range = calendarOverviewMonth(request.nextUrl.searchParams.get("month"));
    if (!range) return NextResponse.json({ error: "A valid month (YYYY-MM) is required" }, { status: 400, headers: responseHeaders });

    const [readIds, manageIds] = await Promise.all([
      listAccessiblePropertyIds(session.userId, session.role, "read"),
      listAccessiblePropertyIds(session.userId, session.role, "manage"),
    ]);
    const manageable = new Set(manageIds);
    const response: CalendarOverviewResponse = {
      month: range.month, startDate: range.startDate, endDate: range.endDate, properties: [],
    };
    if (readIds.length === 0) return NextResponse.json(response, { headers: responseHeaders });

    const properties = await prisma.property.findMany({
      where: { id: { in: readIds } },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true, name: true, minNights: true, checkInTime: true, checkOutTime: true,
        bookingWindow: true, cleaningEnabled: true,
        calendarLinks: { select: { platform: true, bufferBefore: true, bufferAfter: true, lastError: true, lastFetchedAt: true } },
        dateOverrides: {
          where: { date: { gte: range.startDate, lt: range.endDate } },
          select: { date: true, type: true },
        },
      },
    });
    const propertyIds = properties.map((property) => property.id);
    const propertyScope = { propertyId: { in: propertyIds } };
    const [reservations, events] = await Promise.all([
      prisma.reservation.findMany({
        where: { ...propertyScope, checkIn: { lt: range.end }, checkOut: { gte: range.start } },
        select: reservationSelect,
        orderBy: [{ checkIn: "asc" }, { id: "asc" }],
      }),
      prisma.calendarEvent.findMany({
        where: { ...propertyScope, startDate: { lt: range.endDate }, endDate: { gte: range.startDate } },
        select: eventSelect,
        orderBy: [{ startDate: "asc" }, { uid: "asc" }],
      }),
    ]);

    // Preserve source identity before clipping. A local claim may extend into
    // this month while its truncated source, or another claim, is outside it.
    const sourceQueries = reservations.flatMap((reservation) => {
      const linkedPlatform = reservation.linkedEventPlatform || reservation.platform;
      return [
        ...(reservation.linkedEventUid ? [{
          propertyId: reservation.propertyId, platform: linkedPlatform, uid: reservation.linkedEventUid,
        }] : []),
        {
          propertyId: reservation.propertyId,
          platform: reservation.platform,
          startDate: { lt: toReservationDateInput(reservation.checkOut.toISOString()) },
          endDate: { gt: toReservationDateInput(reservation.checkIn.toISOString()) },
        },
      ];
    });
    if (sourceQueries.length > 0) {
      events.push(...await prisma.calendarEvent.findMany({
        where: { ...propertyScope, OR: sourceQueries }, select: eventSelect,
        orderBy: [{ startDate: "asc" }, { uid: "asc" }],
      }));
    }
    const eventKey = (event: typeof events[number]) => `${event.propertyId}\u0000${event.platform}\u0000${event.uid}`;
    const uniqueEvents = [...new Map(events.map((event) => [eventKey(event), event])).values()]
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.uid.localeCompare(b.uid) || a.platform.localeCompare(b.platform));
    if (uniqueEvents.length > 0) {
      const partners = await prisma.reservation.findMany({
        where: {
          ...propertyScope,
          OR: uniqueEvents.flatMap((event) => [
            {
              propertyId: event.propertyId,
              linkedEventUid: event.uid,
              OR: [{ linkedEventPlatform: event.platform }, { linkedEventPlatform: null, platform: event.platform }],
            },
            {
              propertyId: event.propertyId, platform: event.platform, linkedEventUid: null,
              checkIn: { lt: new Date(`${event.endDate}T00:00:00.000Z`) },
              checkOut: { gt: new Date(`${event.startDate}T00:00:00.000Z`) },
            },
          ]),
        },
        select: reservationSelect,
        orderBy: [{ checkIn: "asc" }, { id: "asc" }],
      });
      reservations.push(...partners);
    }
    const uniqueReservations = [...new Map(reservations.map((reservation) => [reservation.id, reservation])).values()]
      .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime() || a.id - b.id);

    response.properties = properties.map((property) => {
      const canManage = manageable.has(property.id);
      const sourceIds = new Map<string, string>();
      const sourceId = (platform: string, uid: string) => {
        if (canManage) return uid;
        const key = `${platform}\u0000${uid}`;
        if (!sourceIds.has(key)) sourceIds.set(key, `source-${sourceIds.size + 1}`);
        return sourceIds.get(key)!;
      };
      return {
        id: property.id, name: property.name, minNights: property.minNights,
        checkInTime: property.checkInTime, checkOutTime: property.checkOutTime,
        bookingWindow: property.bookingWindow, cleaningEnabled: property.cleaningEnabled, canManage,
        reservations: uniqueReservations.filter((reservation) => reservation.propertyId === property.id).map((reservation) => ({
          ...(canManage ? { id: reservation.id } : {}),
          name: canManage ? reservation.name : "Reserved",
          checkIn: reservation.checkIn.toISOString(), checkOut: reservation.checkOut.toISOString(),
          platform: reservation.platform,
          linkedEventUid: reservation.linkedEventUid ? sourceId(reservation.linkedEventPlatform || reservation.platform, reservation.linkedEventUid) : null,
          linkedEventPlatform: reservation.linkedEventPlatform,
          linkedEventRole: reservation.linkedEventRole === "claim" || reservation.linkedEventRole === "extension" ? reservation.linkedEventRole : null,
        })),
        events: uniqueEvents.filter((event) => event.propertyId === property.id).map((event) => ({
          platform: event.platform, uid: sourceId(event.platform, event.uid),
          summary: canManage ? event.summary : event.platform === "airbnb" && (event.summary.includes("Not available") || event.summary.includes("Blocked")) ? "Blocked" : "Reserved",
          startDate: event.startDate, endDate: event.endDate,
        })),
        links: property.calendarLinks.map((link) => ({ platform: link.platform, bufferBefore: link.bufferBefore, bufferAfter: link.bufferAfter })),
        overrides: property.dateOverrides.filter((override) => override.type === "open" || override.type === "closed" || override.type === "cleaning").map((override) => ({
          date: override.date, type: override.type as "open" | "closed" | "cleaning",
        })),
        syncFailed: property.calendarLinks.some((link) => !link.lastFetchedAt || Boolean(link.lastError)),
      };
    });
    return NextResponse.json(response, { headers: responseHeaders });
  } catch (error) {
    console.error("Calendar overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: responseHeaders });
  }
}
