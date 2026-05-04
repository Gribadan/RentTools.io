import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canManageProperty } from "@/lib/ownership";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reservationId = request.nextUrl.searchParams.get("reservationId");
    if (!reservationId) {
      return NextResponse.json({ error: "reservationId required" }, { status: 400 });
    }

    const numId = parseInt(reservationId);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid reservationId" }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: numId },
      select: { propertyId: true },
    });
    if (!reservation || !(await canManageProperty(reservation.propertyId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const guests = await prisma.guest.findMany({
      where: { reservationId: numId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(guests);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
