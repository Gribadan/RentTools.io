import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageProperty, listAccessiblePropertyIds } from "@/lib/ownership";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyId = request.nextUrl.searchParams.get("propertyId");
    const accessibleIds = await listAccessiblePropertyIds(session.userId, session.role);
    const where = propertyId
      ? { propertyId: parseInt(propertyId), property: { id: { in: accessibleIds } } }
      : { property: { id: { in: accessibleIds } } };
    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: { checkIn: "asc" },
      include: { _count: { select: { guests: true } } },
    });
    return NextResponse.json(reservations);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, checkIn, checkOut, platform, propertyId, linkedEventUid } = await request.json();
    if (!name?.trim() || !checkIn || !checkOut || !propertyId) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    if (!(await canManageProperty(propertyId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime())) {
      return NextResponse.json({ error: "Invalid checkIn date" }, { status: 400 });
    }
    if (isNaN(checkOutDate.getTime())) {
      return NextResponse.json({ error: "Invalid checkOut date" }, { status: 400 });
    }
    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ error: "checkOut must be after checkIn" }, { status: 400 });
    }

    // Check overlap with existing RentTools reservations on the same
    // property. The host can't have two reservations covering the same
    // night.
    const overlap = await prisma.reservation.findFirst({
      where: {
        propertyId,
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
      select: { name: true, checkIn: true, checkOut: true },
    });
    if (overlap) {
      return NextResponse.json(
        {
          error: "Overlapping reservation exists",
          existing: {
            name: overlap.name,
            checkIn: overlap.checkIn,
            checkOut: overlap.checkOut,
          },
        },
        { status: 409 }
      );
    }

    // Check overlap with synced calendar events (iCal-imported bookings
    // from Airbnb / Booking / Vrbo). Without this guard a host can
    // create a manual reservation on dates already booked from another
    // platform — the calendar grid would render it as a conflict but
    // the API would silently accept the double-booking, and the iCal
    // feed would expose both events to other platforms. The host
    // wanted to be warned upfront.
    //
    // EXCEPT when the new reservation IS a claim of one specific iCal
    // event (linkedEventUid in the request body). The bar-claim flow
    // POSTs with the same dates as the iCal event being named, so the
    // event would always match its own overlap check and 409. Excluding
    // the linked event by uid lets the claim succeed while still
    // catching genuine double-bookings against OTHER overlapping
    // events.
    const startDateStr = checkInDate.toISOString().substring(0, 10);
    const endDateStr = checkOutDate.toISOString().substring(0, 10);
    const syncedOverlap = await prisma.calendarEvent.findFirst({
      where: {
        propertyId,
        startDate: { lt: endDateStr },
        endDate: { gt: startDateStr },
        ...(linkedEventUid ? { uid: { not: linkedEventUid } } : {}),
      },
      select: { summary: true, platform: true, startDate: true, endDate: true },
    });
    if (syncedOverlap) {
      return NextResponse.json(
        {
          error: "Overlapping booking from another platform",
          existing: {
            name: syncedOverlap.summary || syncedOverlap.platform,
            checkIn: syncedOverlap.startDate,
            checkOut: syncedOverlap.endDate,
            platform: syncedOverlap.platform,
          },
        },
        { status: 409 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        name: name.trim(),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        platform: platform || "airbnb",
        linkedEventUid: linkedEventUid || null,
        propertyId,
      },
    });

    // Clean up open / closed overrides that the new reservation just
    // made obsolete. The iCal feed already silently filters them
    // (commit a629700), but leaving them in the DB is a footgun:
    // when the reservation is later deleted, the overrides "wake up"
    // and the dates revert to force-open / force-closed — almost
    // certainly not what the host wants. Cleaning at write time keeps
    // the data model honest.
    //
    // Only OPEN and CLOSED override types are cleared. CLEANING
    // overrides are kept — those are deliberate scheduling for the
    // cleaner that's independent of whether a reservation exists
    // (the host may have manually scheduled cleaning for the next
    // guest's check-in day, which is exactly the scenario commit
    // cd71074 enabled).
    const datesToClear: string[] = [];
    {
      const d = new Date(checkInDate);
      while (d < checkOutDate) {
        datesToClear.push(d.toISOString().substring(0, 10));
        d.setDate(d.getDate() + 1);
      }
    }
    if (datesToClear.length > 0) {
      await prisma.dateOverride.deleteMany({
        where: {
          propertyId,
          date: { in: datesToClear },
          type: { in: ["open", "closed"] },
        },
      });
    }

    await logAudit(session.userId, "create", "reservation", reservation.id, {
      name: reservation.name,
      propertyId,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
    });
    return NextResponse.json(reservation);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
