import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canManageProperty } from "@/lib/ownership";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyIdParam = request.nextUrl.searchParams.get("propertyId");

    // Cleaners have no message-templates access; only owners and managers do.
    if (session.role === "cleaner") {
      return NextResponse.json({ templates: [] });
    }

    if (propertyIdParam !== null) {
      const propertyId = parseInt(propertyIdParam);
      if (isNaN(propertyId)) {
        return NextResponse.json({ error: "Invalid propertyId" }, { status: 400 });
      }
      if (!(await canManageProperty(propertyId, session.userId, session.role))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const templates = await prisma.messageTemplate.findMany({
        where: { propertyId },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ templates });
    }

    // Aggregate mode (no propertyId) — return every template the user can
    // manage, with property metadata included for grouping. Used by the
    // /dashboard/admin/workspace/message-templates overview surface.
    const templates = await prisma.messageTemplate.findMany({
      where: {
        property: {
          OR: [
            { userId: session.userId },
            { managers: { some: { managerId: session.userId } } },
          ],
        },
      },
      include: { property: { select: { id: true, name: true } } },
      orderBy: [{ propertyId: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ templates });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const propertyId = Number(body.propertyId);
    if (!propertyId || !body.name?.trim() || !body.body?.trim()) {
      return NextResponse.json(
        { error: "propertyId, name, and body required" },
        { status: 400 }
      );
    }
    if (!(await canManageProperty(propertyId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const template = await prisma.messageTemplate.create({
      data: {
        propertyId,
        name: body.name.trim(),
        language: typeof body.language === "string" ? body.language : "en",
        subject: typeof body.subject === "string" ? body.subject : "",
        body: body.body,
        sendOffsetDays: Number.isInteger(body.sendOffsetDays) ? body.sendOffsetDays : 0,
      },
    });
    return NextResponse.json(template);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
