import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const reservationId = request.nextUrl.searchParams.get("reservationId");
  if (!reservationId) {
    return NextResponse.json({ error: "reservationId required" }, { status: 400 });
  }
  const guests = await prisma.guest.findMany({
    where: { reservationId: parseInt(reservationId) },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(guests);
}
