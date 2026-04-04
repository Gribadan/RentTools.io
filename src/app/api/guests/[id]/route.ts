import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};

  if ("parentId" in body) data.parentId = body.parentId;

  const guest = await prisma.guest.update({
    where: { id: parseInt(id) },
    data,
  });
  return NextResponse.json(guest);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.guest.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
