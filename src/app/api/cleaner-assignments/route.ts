import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/cleaner-assignments?propertyId=X — owner lists assignments for a property they own
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyIdParam = request.nextUrl.searchParams.get("propertyId");
    if (!propertyIdParam) {
      return NextResponse.json({ error: "propertyId required" }, { status: 400 });
    }
    const propertyId = parseInt(propertyIdParam);
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: "Invalid propertyId" }, { status: 400 });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { userId: true },
    });
    if (!property || property.userId !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const assignments = await prisma.cleanerAssignment.findMany({
      where: { propertyId },
      orderBy: { createdAt: "asc" },
      include: {
        cleaner: { select: { id: true, username: true } },
      },
    });

    return NextResponse.json(
      assignments.map((a) => ({
        id: a.id,
        propertyId: a.propertyId,
        cleanerId: a.cleanerId,
        username: a.cleaner.username,
        createdAt: a.createdAt,
      }))
    );
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/cleaner-assignments — body { propertyId, username } — owner adds a cleaner by username
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { propertyId, username } = await request.json();
    if (!propertyId || !username?.trim()) {
      return NextResponse.json(
        { error: "propertyId and username required" },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: Number(propertyId) },
      select: { userId: true },
    });
    if (!property || property.userId !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const cleaner = await prisma.user.findUnique({
      where: { username: username.trim() },
      select: { id: true, role: true, username: true },
    });
    if (!cleaner) {
      return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });
    }
    if (cleaner.role !== "cleaner") {
      return NextResponse.json(
        { error: "User does not have the cleaner role" },
        { status: 400 }
      );
    }

    const existing = await prisma.cleanerAssignment.findUnique({
      where: {
        cleanerId_propertyId: {
          cleanerId: cleaner.id,
          propertyId: Number(propertyId),
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Already assigned" },
        { status: 409 }
      );
    }

    const assignment = await prisma.cleanerAssignment.create({
      data: { cleanerId: cleaner.id, propertyId: Number(propertyId) },
    });

    return NextResponse.json({
      id: assignment.id,
      propertyId: assignment.propertyId,
      cleanerId: assignment.cleanerId,
      username: cleaner.username,
      createdAt: assignment.createdAt,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
