import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.checkIn !== undefined) data.checkIn = new Date(body.checkIn);
  if (body.checkOut !== undefined) data.checkOut = new Date(body.checkOut);
  if (body.platform !== undefined) data.platform = body.platform;

  const reservation = await prisma.reservation.update({
    where: { id: parseInt(id) },
    data,
  });
  return NextResponse.json(reservation);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.reservation.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
