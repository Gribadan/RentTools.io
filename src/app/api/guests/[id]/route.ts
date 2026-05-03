import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const body = await request.json();
  const data: Record<string, unknown> = {};

  if ("parentId" in body) data.parentId = body.parentId;

  const guest = await prisma.guest.update({
    where: { id: numId },
    data,
  });
  return NextResponse.json(guest);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  await prisma.guest.delete({ where: { id: numId } });
  return NextResponse.json({ success: true });
}
