import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

async function ensureOwnsProperty(propertyId: number, userId: number) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { userId: true },
  });
  return !!property && property.userId === userId;
}

async function userCanReadProperty(
  propertyId: number,
  userId: number,
  role: string
): Promise<boolean> {
  if (role === "cleaner") {
    const a = await prisma.cleanerAssignment.findUnique({
      where: { cleanerId_propertyId: { cleanerId: userId, propertyId } },
      select: { id: true },
    });
    return !!a;
  }
  return ensureOwnsProperty(propertyId, userId);
}

// GET /api/date-overrides?propertyId=1
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyId = request.nextUrl.searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    const numId = Number(propertyId);
    if (!(await userCanReadProperty(numId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const overrides = await prisma.dateOverride.findMany({
      where: { propertyId: numId },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(overrides);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/date-overrides — toggle a date override (create or delete)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const numId = Number(propertyId);
    if (!(await ensureOwnsProperty(numId, session.userId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Upsert: if same type exists, remove it (toggle off). If different type or none, set it.
    const existing = await prisma.dateOverride.findUnique({
      where: { propertyId_date: { propertyId: numId, date } },
    });

    if (existing && existing.type === type) {
      // Toggle off — remove the override
      await prisma.dateOverride.delete({ where: { id: existing.id } });
      await logAudit(session.userId, "delete", "override", existing.id, {
        propertyId: numId,
        date,
        type,
      });
      return NextResponse.json({ action: "removed", date, type });
    }

    // Create or update
    const override = await prisma.dateOverride.upsert({
      where: { propertyId_date: { propertyId: numId, date } },
      update: { type, note: note || "" },
      create: {
        propertyId: numId,
        date,
        type,
        note: note || "",
      },
    });
    await logAudit(
      session.userId,
      existing ? "update" : "create",
      "override",
      override.id,
      { propertyId: numId, date, type }
    );

    return NextResponse.json({ action: "created", override });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/date-overrides?propertyId=1&date=2025-04-10
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyId = request.nextUrl.searchParams.get("propertyId");
    const date = request.nextUrl.searchParams.get("date");

    if (!propertyId || !date) {
      return NextResponse.json(
        { error: "propertyId and date are required" },
        { status: 400 }
      );
    }

    const numId = Number(propertyId);
    if (!(await ensureOwnsProperty(numId, session.userId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
      const removed = await prisma.dateOverride.delete({
        where: {
          propertyId_date: {
            propertyId: numId,
            date,
          },
        },
      });
      await logAudit(session.userId, "delete", "override", removed.id, {
        propertyId: numId,
        date,
      });
      return NextResponse.json({ action: "removed", date });
    } catch {
      return NextResponse.json({ action: "not_found", date });
    }
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
