import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { listAccessiblePropertyIds } from "@/lib/ownership";
import { maskGuestDocs } from "@/lib/guest-privacy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const q = (request.nextUrl.searchParams.get("q") || "").trim();
    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const accessibleIds = await listAccessiblePropertyIds(session.userId, session.role);
    if (accessibleIds.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const guests = await prisma.guest.findMany({
      where: {
        reservation: { property: { id: { in: accessibleIds } } },
        OR: [
          { fullName: { contains: q } },
          { passportNumber: { contains: q } },
          { country: { contains: q } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        country: true,
        passportNumber: true,
        reservationId: true,
        reservation: {
          select: {
            name: true,
            checkIn: true,
            checkOut: true,
            propertyId: true,
            property: { select: { name: true } },
          },
        },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    // Redact passport / nationality in results when a superadmin is
    // impersonating — search still matches server-side, but the
    // impersonating session never sees the document values.
    const redact = !!session.impersonatorId;
    const results = guests.map((g) => ({
      guestId: g.id,
      fullName: g.fullName,
      reservationId: g.reservationId,
      reservationName: g.reservation.name,
      checkIn: g.reservation.checkIn.toISOString(),
      checkOut: g.reservation.checkOut.toISOString(),
      propertyId: g.reservation.propertyId,
      propertyName: g.reservation.property.name,
      ...maskGuestDocs({ country: g.country, passportNumber: g.passportNumber }, redact),
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
