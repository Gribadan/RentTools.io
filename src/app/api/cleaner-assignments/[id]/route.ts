import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function loadOwned(id: number, userId: number) {
  const assignment = await prisma.cleanerAssignment.findUnique({
    where: { id },
    select: { id: true, propertyId: true, priority: true, property: { select: { userId: true } } },
  });
  if (!assignment || assignment.property.userId !== userId) return null;
  return assignment;
}

// PATCH /api/cleaner-assignments/[id] — body { priority? }
// RT-25.10 — priority reorder for assigned cleaners. Lower number = higher
// rank (0 = default, 1 = first backup, …).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const owned = await loadOwned(numId, session.userId);
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const data: { priority?: number } = {};
    if (typeof body?.priority === "number" && Number.isInteger(body.priority) && body.priority >= 0) {
      data.priority = body.priority;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.cleanerAssignment.update({
      where: { id: numId },
      data,
      select: { id: true, propertyId: true, priority: true },
    });
    return NextResponse.json(updated);
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

    const owned = await loadOwned(numId, session.userId);
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.cleanerAssignment.delete({ where: { id: numId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
