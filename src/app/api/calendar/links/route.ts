import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageProperty } from "@/lib/ownership";
import { isValidPlatformSlug } from "@/lib/platforms";

// GET /api/calendar/links?propertyId=1
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyId = request.nextUrl.searchParams.get("propertyId");

    // Cleaners have no calendar-links access; only owners and managers do.
    if (session.role === "cleaner") {
      return NextResponse.json([]);
    }

    const baseFilter = {
      property: {
        OR: [
          { userId: session.userId },
          { managers: { some: { managerId: session.userId } } },
        ],
      },
    };

    const where = propertyId
      ? { propertyId: Number(propertyId), ...baseFilter }
      : baseFilter;

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

    // Any slug the platform registry considers canonical is allowed here.
    // The onboarding wizard already persists arbitrary platforms, the feed
    // route resolves `for-<slug>.ics` for arbitrary slugs, and PLATFORM_PRESETS
    // ships twelve of them — this route was the only place still pinned to
    // the original airbnb/booking pair, so hosts on Vrbo, Expedia, Agoda or a
    // custom source could not save a link after signup.
    if (typeof platform !== "string" || !isValidPlatformSlug(platform)) {
      return NextResponse.json(
        { error: "platform must be a valid slug: lower-case a-z, 0-9 and dashes, 1-32 chars" },
        { status: 400 }
      );
    }

    if (!(await canManageProperty(Number(propertyId), session.userId, session.role))) {
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
      await logAudit(session.userId, "update", "calendarLink", updated.id, {
        platform,
        propertyId: Number(propertyId),
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
    await logAudit(session.userId, "create", "calendarLink", link.id, {
      platform,
      propertyId: Number(propertyId),
    });

    return NextResponse.json(link);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
