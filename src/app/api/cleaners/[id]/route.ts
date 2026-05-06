import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function loadOwned(id: number, userId: number) {
  const cleaner = await prisma.cleaner.findUnique({
    where: { id },
    select: { id: true, ownerUserId: true },
  });
  if (!cleaner || cleaner.ownerUserId !== userId) return null;
  return cleaner;
}

// PATCH /api/cleaners/[id] — body { name?, phone? } — rename / update phone
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const numId = Number.parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const owned = await loadOwned(numId, session.userId);
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: { name?: string; phone?: string | null } = {};
    if (typeof body?.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
      if (name.length > 120) {
        return NextResponse.json({ error: "name too long" }, { status: 400 });
      }
      data.name = name;
    }
    if (body?.phone !== undefined) {
      if (body.phone === null) {
        data.phone = null;
      } else if (typeof body.phone === "string") {
        const trimmed = body.phone.trim().slice(0, 32);
        data.phone = trimmed.length > 0 ? trimmed : null;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.cleaner.update({
      where: { id: numId },
      data,
      select: { id: true, name: true, phone: true, createdAt: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/cleaners/[id] — cascades through CleanerAssignment.cleanerProfileId
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const numId = Number.parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const owned = await loadOwned(numId, session.userId);
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.cleaner.delete({ where: { id: numId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
