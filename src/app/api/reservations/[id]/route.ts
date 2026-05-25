import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageProperty } from "@/lib/ownership";
import { normalizePhone } from "@/lib/sanitize";

async function loadManageableReservation(
  reservationId: number,
  userId: number,
  role: string
) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: { id: true, propertyId: true },
  });
  if (!reservation) return null;
  if (!(await canManageProperty(reservation.propertyId, userId, role))) return null;
  return reservation;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const owned = await loadManageableReservation(numId, session.userId, session.role);
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.checkIn !== undefined) data.checkIn = new Date(body.checkIn);
    if (body.checkOut !== undefined) data.checkOut = new Date(body.checkOut);
    if (body.platform !== undefined) data.platform = body.platform;

    // Host-editable group-chat name override. Empty string / whitespace
    // clears it (back to the auto-generated name); otherwise store the
    // trimmed text.
    if (body.groupName !== undefined) {
      const v = typeof body.groupName === "string" ? body.groupName.trim() : "";
      data.groupName = v === "" ? null : v;
    }

    // Per-reservation messenger group URLs. Empty string clears the
    // value (null in DB); a real URL must start with the platform's
    // canonical public prefix so we don't accidentally save a chat
    // deep-link, an Android intent URL, or anything that won't open
    // a group page in the desktop / mobile messenger.
    if (body.tgGroupUrl !== undefined) {
      const v = typeof body.tgGroupUrl === "string" ? body.tgGroupUrl.trim() : "";
      if (v === "") {
        data.tgGroupUrl = null;
      } else if (!/^https:\/\/t\.me\//i.test(v)) {
        return NextResponse.json(
          { error: "Telegram group URL must start with https://t.me/" },
          { status: 400 },
        );
      } else {
        data.tgGroupUrl = v;
      }
    }
    if (body.waGroupUrl !== undefined) {
      const v = typeof body.waGroupUrl === "string" ? body.waGroupUrl.trim() : "";
      if (v === "") {
        data.waGroupUrl = null;
      } else if (!/^https:\/\/chat\.whatsapp\.com\//i.test(v)) {
        return NextResponse.json(
          { error: "WhatsApp group URL must start with https://chat.whatsapp.com/" },
          { status: 400 },
        );
      } else {
        data.waGroupUrl = v;
      }
    }

    // Reservation contact phone — same loose-E.164 normalisation the
    // Guest.phone PATCH uses so the host can use the same input shape
    // and the WA/TG deeplinks resolve cleanly. Empty clears.
    if (body.phone !== undefined) {
      const v = typeof body.phone === "string" ? body.phone : "";
      try {
        const normalised = normalizePhone(v);
        data.phone = normalised === "" ? null : normalised;
      } catch {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      }
    }

    // If the date range is changing, check for overlap with OTHER
    // reservations on the same property. The POST endpoint already
    // does this for new reservations; PATCH was missing the same
    // guard, which let a host shorten or extend a reservation into
    // a range covered by another reservation — silent double-booking.
    if (data.checkIn !== undefined || data.checkOut !== undefined) {
      const current = await prisma.reservation.findUnique({
        where: { id: numId },
        select: { checkIn: true, checkOut: true, propertyId: true },
      });
      if (current) {
        const newCheckIn = (data.checkIn as Date | undefined) ?? current.checkIn;
        const newCheckOut = (data.checkOut as Date | undefined) ?? current.checkOut;
        if (newCheckOut <= newCheckIn) {
          return NextResponse.json({ error: "checkOut must be after checkIn" }, { status: 400 });
        }
        const overlap = await prisma.reservation.findFirst({
          where: {
            propertyId: current.propertyId,
            id: { not: numId },
            checkIn: { lt: newCheckOut },
            checkOut: { gt: newCheckIn },
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
            { status: 409 },
          );
        }

        // Same synced-event check the POST endpoint runs — a host
        // editing a reservation's dates can't extend / shift it into
        // a range already covered by an iCal-imported event from
        // another platform.
        const newStartStr = newCheckIn.toISOString().substring(0, 10);
        const newEndStr = newCheckOut.toISOString().substring(0, 10);
        const syncedOverlap = await prisma.calendarEvent.findFirst({
          where: {
            propertyId: current.propertyId,
            startDate: { lt: newEndStr },
            endDate: { gt: newStartStr },
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
            { status: 409 },
          );
        }
      }
    }

    const reservation = await prisma.reservation.update({
      where: { id: numId },
      data,
    });

    // Same cleanup as the POST path — clear open/closed overrides on
    // the reservation's current date range so they don't shadow the
    // booking. We do this even if the date range didn't change in
    // this PATCH (cheap deleteMany, idempotent), so a host who first
    // creates an override and then later edits a reservation that
    // already covered those dates also gets the cleanup.
    {
      const datesToClear: string[] = [];
      const start = new Date(reservation.checkIn);
      const end = new Date(reservation.checkOut);
      const d = new Date(start);
      while (d < end) {
        datesToClear.push(d.toISOString().substring(0, 10));
        d.setDate(d.getDate() + 1);
      }
      if (datesToClear.length > 0) {
        await prisma.dateOverride.deleteMany({
          where: {
            propertyId: reservation.propertyId,
            date: { in: datesToClear },
            type: { in: ["open", "closed"] },
          },
        });
      }
    }

    await logAudit(session.userId, "update", "reservation", numId, data);
    return NextResponse.json(reservation);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const owned = await loadManageableReservation(numId, session.userId, session.role);
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.reservation.delete({ where: { id: numId } });
    await logAudit(session.userId, "delete", "reservation", numId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
