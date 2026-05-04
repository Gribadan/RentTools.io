import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isPropertyOwner } from "@/lib/ownership";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// GET /api/property-managers?propertyId=X — list managers for a property (owner only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyIdRaw = request.nextUrl.searchParams.get("propertyId");
    if (!propertyIdRaw) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }
    const propertyId = parseInt(propertyIdRaw);
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: "Invalid propertyId" }, { status: 400 });
    }

    if (!(await isPropertyOwner(propertyId, session.userId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const managers = await prisma.propertyManager.findMany({
      where: { propertyId },
      include: {
        manager: { select: { id: true, username: true, role: true, createdAt: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      managers.map(m => ({
        id: m.id,
        managerId: m.managerId,
        username: m.manager.username,
        role: m.manager.role,
        createdAt: m.createdAt,
      }))
    );
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/property-managers — grant manager access (owner only)
// Body: { propertyId, username }
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const propertyId = parseInt(String(body.propertyId));
    const username = String(body.username || "").trim();

    if (isNaN(propertyId) || !username) {
      return NextResponse.json(
        { error: "propertyId and username are required" },
        { status: 400 }
      );
    }

    if (!(await isPropertyOwner(propertyId, session.userId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Find the user to add
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, role: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: `User "${username}" not found` },
        { status: 404 }
      );
    }
    if (user.id === session.userId) {
      return NextResponse.json(
        { error: "You already own this property" },
        { status: 400 }
      );
    }

    // Check if already a manager
    const existing = await prisma.propertyManager.findUnique({
      where: { managerId_propertyId: { managerId: user.id, propertyId } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: `${username} is already a manager` },
        { status: 409 }
      );
    }

    const created = await prisma.propertyManager.create({
      data: {
        propertyId,
        managerId: user.id,
        grantedById: session.userId,
      },
    });

    await logAudit(session.userId, "create", "manager", created.id, {
      propertyId,
      managerId: user.id,
      managerUsername: user.username,
    });

    return NextResponse.json({
      id: created.id,
      managerId: user.id,
      username: user.username,
      role: user.role,
      createdAt: created.createdAt,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/property-managers?propertyId=X&managerId=Y — revoke (owner only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyIdRaw = request.nextUrl.searchParams.get("propertyId");
    const managerIdRaw = request.nextUrl.searchParams.get("managerId");
    const propertyId = parseInt(propertyIdRaw || "");
    const managerId = parseInt(managerIdRaw || "");
    if (isNaN(propertyId) || isNaN(managerId)) {
      return NextResponse.json(
        { error: "propertyId and managerId are required" },
        { status: 400 }
      );
    }

    if (!(await isPropertyOwner(propertyId, session.userId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
      const removed = await prisma.propertyManager.delete({
        where: { managerId_propertyId: { managerId, propertyId } },
      });
      await logAudit(session.userId, "delete", "manager", removed.id, {
        propertyId,
        managerId,
      });
      return NextResponse.json({ action: "removed" });
    } catch {
      return NextResponse.json({ action: "not_found" });
    }
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
