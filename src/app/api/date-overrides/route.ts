import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/date-overrides?propertyId=1
export async function GET(request: NextRequest) {
  const propertyId = request.nextUrl.searchParams.get("propertyId");

  if (!propertyId) {
    return NextResponse.json(
      { error: "propertyId is required" },
      { status: 400 }
    );
  }

  const overrides = await prisma.dateOverride.findMany({
    where: { propertyId: Number(propertyId) },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(overrides);
}

// POST /api/date-overrides — toggle a date override (create or delete)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { propertyId, date, type, note } = body;

  if (!propertyId || !date || !type) {
    return NextResponse.json(
      { error: "propertyId, date, and type are required" },
      { status: 400 }
    );
  }

  if (!["open", "closed"].includes(type)) {
    return NextResponse.json(
      { error: "type must be 'open' or 'closed'" },
      { status: 400 }
    );
  }

  // Upsert: if same type exists, remove it (toggle off). If different type or none, set it.
  const existing = await prisma.dateOverride.findUnique({
    where: { propertyId_date: { propertyId: Number(propertyId), date } },
  });

  if (existing && existing.type === type) {
    // Toggle off — remove the override
    await prisma.dateOverride.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed", date, type });
  }

  // Create or update
  const override = await prisma.dateOverride.upsert({
    where: { propertyId_date: { propertyId: Number(propertyId), date } },
    update: { type, note: note || "" },
    create: {
      propertyId: Number(propertyId),
      date,
      type,
      note: note || "",
    },
  });

  return NextResponse.json({ action: "created", override });
}

// DELETE /api/date-overrides?propertyId=1&date=2025-04-10
export async function DELETE(request: NextRequest) {
  const propertyId = request.nextUrl.searchParams.get("propertyId");
  const date = request.nextUrl.searchParams.get("date");

  if (!propertyId || !date) {
    return NextResponse.json(
      { error: "propertyId and date are required" },
      { status: 400 }
    );
  }

  try {
    await prisma.dateOverride.delete({
      where: {
        propertyId_date: {
          propertyId: Number(propertyId),
          date,
        },
      },
    });
    return NextResponse.json({ action: "removed", date });
  } catch {
    return NextResponse.json({ action: "not_found", date });
  }
}
