import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageProperty } from "@/lib/ownership";

async function loadManageableLink(linkId: number, userId: number, role: string) {
  const link = await prisma.calendarLink.findUnique({
    where: { id: linkId },
    select: {
      id: true,
      propertyId: true,
      platform: true,
    },
  });
  if (!link) return null;
  if (!(await canManageProperty(link.propertyId, userId, role))) return null;
  return link;
}

// PATCH /api/calendar/links/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const owned = await loadManageableLink(numId, session.userId, session.role);
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();

    const updated = await prisma.calendarLink.update({
      where: { id: numId },
      data: {
        ...(body.icalExportUrl !== undefined && { icalExportUrl: body.icalExportUrl }),
        ...(body.bufferBefore !== undefined && { bufferBefore: body.bufferBefore }),
        ...(body.bufferAfter !== undefined && { bufferAfter: body.bufferAfter }),
      },
    });
    await logAudit(session.userId, "update", "calendarLink", numId, {
      bufferBefore: body.bufferBefore,
      bufferAfter: body.bufferAfter,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/calendar/links/[id]
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

    const owned = await loadManageableLink(numId, session.userId, session.role);
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Remove events from this platform for this property
    await prisma.calendarEvent.deleteMany({
      where: { propertyId: owned.propertyId, platform: owned.platform },
    });

    await prisma.calendarLink.delete({ where: { id: numId } });
    await logAudit(session.userId, "delete", "calendarLink", numId, {
      platform: owned.platform,
      propertyId: owned.propertyId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
