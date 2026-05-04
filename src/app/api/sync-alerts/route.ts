import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { alertsDismissedAt: true },
    });

    const ownedProperties = await prisma.property.findMany({
      where: { userId: session.userId },
      select: { id: true },
    });
    const propertyIds = ownedProperties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return NextResponse.json({ alerts: [] });
    }

    const alerts = await prisma.syncLog.findMany({
      where: {
        propertyId: { in: propertyIds },
        level: "error",
        message: { startsWith: "[ALERT]" },
        ...(user?.alertsDismissedAt
          ? { createdAt: { gt: user.alertsDismissedAt } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, propertyId: true, message: true, createdAt: true },
    });

    return NextResponse.json({ alerts });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.user.update({
      where: { id: session.userId },
      data: { alertsDismissedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
