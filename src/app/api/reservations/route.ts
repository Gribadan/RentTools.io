import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageProperty, listAccessiblePropertyIds } from "@/lib/ownership";
import { normalizePlatformSlug } from "@/lib/platforms";
import { parseReservationDate } from "@/lib/reservation-dates";
import { loadEffectiveLinkedStayRange } from "@/lib/linked-stay";

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

    const {
      name,
      checkIn,
      checkOut,
      platform,
      propertyId,
      linkedEventUid,
      linkedEventPlatform,
      linkedEventRole,
      bookedGuestCount,
    } = await request.json();
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof checkIn !== "string" ||
      typeof checkOut !== "string" ||
      !Number.isInteger(propertyId) ||
      propertyId <= 0 ||
      (platform !== undefined && typeof platform !== "string") ||
      (linkedEventPlatform !== undefined &&
        linkedEventPlatform !== null &&
        typeof linkedEventPlatform !== "string") ||
      (linkedEventRole !== undefined &&
        linkedEventRole !== null &&
        typeof linkedEventRole !== "string") ||
      (bookedGuestCount !== undefined &&
        (!Number.isInteger(bookedGuestCount) || bookedGuestCount < 1 || bookedGuestCount > 50))
    ) {
      return NextResponse.json({ error: "Invalid reservation data" }, { status: 400 });
    }

    if (!(await canManageProperty(propertyId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const checkInDate = parseReservationDate(checkIn);
    const checkOutDate = parseReservationDate(checkOut);
    if (!checkInDate) {
      return NextResponse.json({ error: "Invalid checkIn date" }, { status: 400 });
    }
    if (!checkOutDate) {
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
    // event would always match its own overlap check and 409. A UID is
    // only unique within a property's platform feed, so validate and
    // exclude the exact (property, platform, uid) source. Another
    // platform can legitimately emit the same UID and must still be
    // treated as a conflicting booking.
    const hasLinkedSource =
      linkedEventUid !== undefined &&
      linkedEventUid !== null &&
      linkedEventUid !== "";
    const startDateStr = checkInDate.toISOString().substring(0, 10);
    const endDateStr = checkOutDate.toISOString().substring(0, 10);
    let reservationPlatform = platform || "airbnb";
    let sourceIdentity: { platform: string; uid: string } | null = null;
    let sourceRole: "claim" | "extension" | null = null;

    if (hasLinkedSource) {
      // New clients send linkedEventPlatform because an extension's actual
      // channel is Direct. Legacy clients sent only `platform`; keep accepting
      // that shape and infer claim vs extension from the validated geometry.
      const rawSourcePlatform = linkedEventPlatform ?? platform;
      if (
        typeof rawSourcePlatform !== "string" ||
        typeof linkedEventUid !== "string"
      ) {
        return NextResponse.json(
          { error: "Invalid linked calendar event" },
          { status: 400 },
        );
      }

      const normalizedPlatform = normalizePlatformSlug(rawSourcePlatform);
      const normalizedUid = linkedEventUid.trim();
      if (!normalizedPlatform || !normalizedUid) {
        return NextResponse.json(
          { error: "Invalid linked calendar event" },
          { status: 400 },
        );
      }

      const linkedSource = await prisma.calendarEvent.findFirst({
        where: {
          propertyId,
          platform: normalizedPlatform,
          uid: normalizedUid,
        },
        select: { id: true, startDate: true, endDate: true },
      });
      if (!linkedSource) {
        return NextResponse.json(
          { error: "Linked calendar event not found" },
          { status: 409 },
        );
      }

      const effectiveSource = await loadEffectiveLinkedStayRange({
        propertyId,
        sourcePlatform: normalizedPlatform,
        sourceUid: normalizedUid,
        source: linkedSource,
      });
      const overlapsSource =
        effectiveSource.startDate < endDateStr &&
        effectiveSource.endDate > startDateStr;
      const abutsSource =
        endDateStr === effectiveSource.startDate ||
        startDateStr === effectiveSource.endDate;
      if (!overlapsSource && !abutsSource) {
        return NextResponse.json(
          { error: "Linked booking relationship cannot be changed" },
          { status: 409 },
        );
      }

      const inferredRole: "claim" | "extension" = overlapsSource
        ? "claim"
        : "extension";
      const requestedRole =
        linkedEventRole === undefined ||
        linkedEventRole === null ||
        linkedEventRole === ""
          ? null
          : linkedEventRole;
      if (
        requestedRole !== null &&
        (requestedRole !== "claim" && requestedRole !== "extension")
      ) {
        return NextResponse.json(
          { error: "Invalid linked calendar event role" },
          { status: 400 },
        );
      }
      if (requestedRole !== null && requestedRole !== inferredRole) {
        return NextResponse.json(
          { error: "Linked booking relationship cannot be changed" },
          { status: 409 },
        );
      }

      sourceRole = requestedRole ?? inferredRole;
      // The platform field is the actual booking/payment channel. A manually
      // agreed extension must be exported back to every OTA, including the
      // source OTA, so it is Direct rather than masquerading as source-owned.
      reservationPlatform =
        sourceRole === "extension" ? "direct" : normalizedPlatform;
      sourceIdentity = { platform: normalizedPlatform, uid: normalizedUid };
    } else if (
      linkedEventPlatform !== undefined ||
      linkedEventRole !== undefined
    ) {
      return NextResponse.json(
        { error: "Invalid linked calendar event" },
        { status: 400 },
      );
    }

    const syncedOverlap = await prisma.calendarEvent.findFirst({
      where: {
        propertyId,
        startDate: { lt: endDateStr },
        endDate: { gt: startDateStr },
        ...(sourceIdentity ? { NOT: sourceIdentity } : {}),
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
        platform: reservationPlatform,
        linkedEventUid: sourceIdentity?.uid || null,
        linkedEventPlatform: sourceIdentity?.platform || null,
        linkedEventRole: sourceRole,
        ...(bookedGuestCount !== undefined ? { bookedGuestCount } : {}),
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
      platform: reservation.platform,
      linkedEventPlatform: reservation.linkedEventPlatform,
      linkedEventRole: reservation.linkedEventRole,
    });
    return NextResponse.json(reservation);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
