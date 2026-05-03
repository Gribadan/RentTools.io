import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const propertyId = request.nextUrl.searchParams.get("propertyId");
    const reservations = await prisma.reservation.findMany({
      where: propertyId ? { propertyId: parseInt(propertyId) } : undefined,
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
    const { name, checkIn, checkOut, platform, propertyId, linkedEventUid } = await request.json();
    if (!name?.trim() || !checkIn || !checkOut || !propertyId) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
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
    return NextResponse.json(reservation);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
