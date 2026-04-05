import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncAllCalendars } from "@/lib/calendar-sync";

// POST /api/calendar/sync — trigger a manual sync
export async function POST() {
  try {
    const result = await syncAllCalendars();
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/calendar/sync — get sync logs + events
export async function GET(request: NextRequest) {
  const propertyId = request.nextUrl.searchParams.get("propertyId");
  const limit = Number(request.nextUrl.searchParams.get("limit") || "50");

  const logsWhere = propertyId
    ? { OR: [{ propertyId: Number(propertyId) }, { propertyId: null }] }
    : {};

  const [logs, events] = await Promise.all([
    prisma.syncLog.findMany({
      where: logsWhere,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.calendarEvent.findMany({
      where: propertyId ? { propertyId: Number(propertyId) } : {},
      orderBy: { startDate: "asc" },
    }),
  ]);

  return NextResponse.json({ logs, events });
}
