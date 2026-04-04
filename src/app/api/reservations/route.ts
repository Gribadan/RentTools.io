import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const propertyId = request.nextUrl.searchParams.get("propertyId");
  const reservations = await prisma.reservation.findMany({
    where: propertyId ? { propertyId: parseInt(propertyId) } : undefined,
    orderBy: { checkIn: "asc" },
    include: { _count: { select: { guests: true } } },
  });
  return NextResponse.json(reservations);
}

export async function POST(request: NextRequest) {
  const { name, checkIn, checkOut, platform, propertyId } = await request.json();
  if (!name?.trim() || !checkIn || !checkOut || !propertyId) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  const reservation = await prisma.reservation.create({
    data: {
      name: name.trim(),
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      platform: platform || "airbnb",
      propertyId,
    },
  });
  return NextResponse.json(reservation);
}
