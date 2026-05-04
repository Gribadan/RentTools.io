import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";

// Per-user usage view for the admin panel (RT-15.10).
// Returns aggregated counts so the superadmin can spot heavy users
// or dormant accounts at a glance. Sorting is done client-side.
export async function GET() {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) return NextResponse.json([]);

    const propertyCounts = await prisma.property.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: { _all: true },
    });
    const propertyMap = new Map<number, number>();
    for (const r of propertyCounts) propertyMap.set(r.userId, r._count._all);

    // Reservations are linked to users via Property.userId.
    // Pull reservation→property mapping for owned properties only.
    const reservations = await prisma.reservation.findMany({
      where: { property: { userId: { in: userIds } } },
      select: { property: { select: { userId: true } } },
    });
    const reservationMap = new Map<number, number>();
    for (const r of reservations) {
      const uid = r.property.userId;
      reservationMap.set(uid, (reservationMap.get(uid) ?? 0) + 1);
    }

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const extractionCounts = await prisma.extractionLog.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, createdAt: { gte: since } },
      _count: { _all: true },
    });
    const extractionMap = new Map<number, number>();
    for (const r of extractionCounts) extractionMap.set(r.userId, r._count._all);

    const rows = users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      propertyCount: propertyMap.get(u.id) ?? 0,
      reservationCount: reservationMap.get(u.id) ?? 0,
      extractionCount30d: extractionMap.get(u.id) ?? 0,
    }));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
