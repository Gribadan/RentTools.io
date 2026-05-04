import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const include = {
      reservations: {
        orderBy: { checkIn: "asc" as const },
        include: { _count: { select: { guests: true } } },
      },
    };
    const orderBy = { createdAt: "desc" as const };
    // Properties accessible to a regular/superadmin user: ones they own OR manage.
    // Cleaners only see assigned properties.
    const where =
      session.role === "cleaner"
        ? { cleanerAssignments: { some: { cleanerId: session.userId } } }
        : {
            OR: [
              { userId: session.userId },
              { managers: { some: { managerId: session.userId } } },
            ],
          };

    // Backward-compatible: when neither page nor limit is supplied, return the full array.
    if (pageParam === null && limitParam === null) {
      const properties = await prisma.property.findMany({ where, orderBy, include });
      return NextResponse.json(properties);
    }

    const page = Math.max(1, parseInt(pageParam ?? "1") || 1);
    const limit = Math.max(1, Math.min(100, parseInt(limitParam ?? "20") || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.property.findMany({ where, orderBy, include, skip, take: limit }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const property = await prisma.property.create({
      data: { name: name.trim(), userId: session.userId },
    });
    await logAudit(session.userId, "create", "property", property.id, { name: property.name });
    return NextResponse.json(property);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
