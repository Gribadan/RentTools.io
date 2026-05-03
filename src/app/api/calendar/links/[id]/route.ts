import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/calendar/links/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const body = await request.json();

    const link = await prisma.calendarLink.findUnique({
      where: { id: numId },
    });
    if (!link) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.calendarLink.update({
      where: { id: numId },
      data: {
        ...(body.icalExportUrl !== undefined && { icalExportUrl: body.icalExportUrl }),
        ...(body.bufferBefore !== undefined && { bufferBefore: body.bufferBefore }),
        ...(body.bufferAfter !== undefined && { bufferAfter: body.bufferAfter }),
      },
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
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // Also remove associated events
    const link = await prisma.calendarLink.findUnique({
      where: { id: numId },
    });

    if (!link) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Remove events from this platform for this property
    await prisma.calendarEvent.deleteMany({
      where: { propertyId: link.propertyId, platform: link.platform },
    });

    await prisma.calendarLink.delete({ where: { id: numId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
