import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncAllCalendars } from "@/lib/calendar-sync";
import { getSession } from "@/lib/auth";
import { canReadProperty, listAccessiblePropertyIds } from "@/lib/ownership";

// POST /api/calendar/sync — trigger a manual sync
// NOTE: this still triggers a sync across all calendar links in the system; downstream
// reads enforce per-user filtering. RT-7.x can refine to a user-scoped sync if needed.
export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await syncAllCalendars();

    // Record run
    const now = new Date().toISOString();
    await prisma.appSettings.upsert({
      where: { key: "sync_last_run" },
      update: { value: now },
      create: { key: "sync_last_run", value: now },
    });
    await prisma.appSettings.upsert({
      where: { key: "sync_last_result" },
      update: { value: JSON.stringify(result) },
      create: { key: "sync_last_result", value: JSON.stringify(result) },
    });

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/calendar/sync — get sync logs + events scoped to current user's properties
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyId = request.nextUrl.searchParams.get("propertyId");
    const limit = Number(request.nextUrl.searchParams.get("limit") || "50");

    // Resolve which propertyIds the current user can access (owner / manager /
    // cleaner). Logs/events are scoped to that set (logs without propertyId are
    // global — keep them visible to everyone authenticated).
    const ownedIds = await listAccessiblePropertyIds(session.userId, session.role);

    if (propertyId) {
      const numId = Number(propertyId);
      if (!(await canReadProperty(numId, session.userId, session.role))) {
        return NextResponse.json({ logs: [], events: [] });
      }
    }

    const propertyFilter = propertyId
      ? { propertyId: Number(propertyId) }
      : { propertyId: { in: ownedIds } };

    // RT-25.4 — when a propertyId is supplied, drop global (null
    // propertyId) entries from the result. Each property's settings
    // page should show only its own log entries; "Sync started"
    // banners belong on the dashboard-level Tasks panel which queries
    // without a propertyId filter.
    const logsWhere = propertyId
      ? { propertyId: Number(propertyId) }
      : { OR: [{ propertyId: { in: ownedIds } }, { propertyId: null }] };

    const [logs, events] = await Promise.all([
      prisma.syncLog.findMany({
        where: logsWhere,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.calendarEvent.findMany({
        where: propertyFilter,
        orderBy: { startDate: "asc" },
      }),
    ]);

    return NextResponse.json({ logs, events });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
