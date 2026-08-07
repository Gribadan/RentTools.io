import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageProperty } from "@/lib/ownership";
import { normalizeIcalUrl, normalizePlatformSlug } from "@/lib/calendar-link-input";

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

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    // RentTools syncs any iCal-capable platform, and /api/onboard has always
    // accepted a free-form slug. This route still carried an
    // ["airbnb","booking"] allowlist, so adding a Vrbo / Rentalia / HomeToGo
    // feed from inside the app 400'd — reported as "the window simply
    // disappears" because the client never surfaced the error.
    const platformResult = normalizePlatformSlug(platform);
    if (!platformResult.ok) {
      return NextResponse.json({ error: platformResult.error }, { status: 400 });
    }
    const platformSlug = platformResult.platform;

    const urlResult = normalizeIcalUrl(icalExportUrl);
    if (!urlResult.ok) {
      return NextResponse.json({ error: urlResult.error }, { status: 400 });
    }
    const normalizedUrl = urlResult.url;

    if (!(await canManageProperty(Number(propertyId), session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if link already exists for this property+platform
    const existing = await prisma.calendarLink.findFirst({
      where: { propertyId: Number(propertyId), platform: platformSlug },
    });

    if (existing) {
      // Update existing
      const updated = await prisma.calendarLink.update({
        where: { id: existing.id },
        data: {
          icalExportUrl: normalizedUrl,
          bufferBefore: bufferBefore ?? existing.bufferBefore,
          bufferAfter: bufferAfter ?? existing.bufferAfter,
          lastError: null,
          // The host just supplied a new URL, so the old streak no longer
          // describes this link. Leaving it would keep a repaired feed
          // looking permanently broken in the sync health view.
          failureCount: 0,
        },
      });
      await logAudit(session.userId, "update", "calendarLink", updated.id, {
        platform: platformSlug,
        propertyId: Number(propertyId),
      });
      return NextResponse.json(updated);
    }

    const link = await prisma.calendarLink.create({
      data: {
        propertyId: Number(propertyId),
        platform: platformSlug,
        icalExportUrl: normalizedUrl,
        bufferBefore: bufferBefore ?? 1,
        bufferAfter: bufferAfter ?? 1,
      },
    });
    await logAudit(session.userId, "create", "calendarLink", link.id, {
      platform: platformSlug,
      propertyId: Number(propertyId),
    });

    return NextResponse.json(link);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
