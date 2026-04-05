import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/calendar/links?propertyId=1
export async function GET(request: NextRequest) {
  const propertyId = request.nextUrl.searchParams.get("propertyId");

  const where = propertyId ? { propertyId: Number(propertyId) } : {};
  const links = await prisma.calendarLink.findMany({
    where,
    include: { property: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(links);
}

// POST /api/calendar/links
export async function POST(request: NextRequest) {
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
}
