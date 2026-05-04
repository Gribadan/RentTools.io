import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/calendar/links?propertyId=1
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyId = request.nextUrl.searchParams.get("propertyId");

    const where = propertyId
      ? { propertyId: Number(propertyId), property: { userId: session.userId } }
      : { property: { userId: session.userId } };

    const links = await prisma.calendarLink.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(links);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/calendar/links
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { propertyId, platform, icalExportUrl, bufferBefore, bufferAfter } = body;

    if (!propertyId || !platform || !icalExportUrl) {
      return NextResponse.json(
        { error: "propertyId, platform, and icalExportUrl are required" },
        { status: 400 }
      );
    }

    if (!["airbnb", "booking"].includes(platform)) {
      return NextResponse.json(
        { error: "platform must be 'airbnb' or 'booking'" },
        { status: 400 }
      );
    }

    const owner = await prisma.property.findUnique({
      where: { id: Number(propertyId) },
      select: { userId: true },
    });
    if (!owner || owner.userId !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if link already exists for this property+platform
    const existing = await prisma.calendarLink.findFirst({
      where: { propertyId: Number(propertyId), platform },
    });

    if (existing) {
      // Update existing
      const updated = await prisma.calendarLink.update({
        where: { id: existing.id },
        data: {
          icalExportUrl,
          bufferBefore: bufferBefore ?? existing.bufferBefore,
          bufferAfter: bufferAfter ?? existing.bufferAfter,
          lastError: null,
        },
      });
      return NextResponse.json(updated);
    }

    const link = await prisma.calendarLink.create({
      data: {
        propertyId: Number(propertyId),
        platform,
        icalExportUrl,
        bufferBefore: bufferBefore ?? 1,
        bufferAfter: bufferAfter ?? 1,
      },
    });

    return NextResponse.json(link);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
