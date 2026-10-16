import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { syncFrequency, SYNC_FREQUENCIES } from "@/lib/calendar-schedule";
import { logAudit } from "@/lib/audit";

// GET /api/calendar/schedule — get sync schedule settings
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const settings = await prisma.appSettings.findMany({
      where: { key: { in: ["sync_auto_enabled", "sync_frequency_minutes", "sync_last_run", "sync_last_result"] } },
    });

    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;

    return NextResponse.json({
      autoEnabled: map.sync_auto_enabled !== "false",
      frequencyMinutes: syncFrequency(map.sync_frequency_minutes),
      lastRun: map.sync_last_run || null,
      lastResult: map.sync_last_result || null,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/calendar/schedule — update sync schedule settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: "Invalid schedule" }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid schedule" }, { status: 400 });
    }
    const settings = body as { autoEnabled?: unknown; frequencyMinutes?: unknown };
    if (("autoEnabled" in settings && typeof settings.autoEnabled !== "boolean") ||
        ("frequencyMinutes" in settings && !SYNC_FREQUENCIES.some((value) => value === settings.frequencyMinutes))) {
      return NextResponse.json({ error: "Invalid schedule" }, { status: 400 });
    }

    if ("autoEnabled" in settings) {
      await prisma.appSettings.upsert({
        where: { key: "sync_auto_enabled" },
        update: { value: String(settings.autoEnabled) },
        create: { key: "sync_auto_enabled", value: String(settings.autoEnabled) },
      });
    }

    if ("frequencyMinutes" in settings) {
      await prisma.appSettings.upsert({
        where: { key: "sync_frequency_minutes" },
        update: { value: String(settings.frequencyMinutes) },
        create: { key: "sync_frequency_minutes", value: String(settings.frequencyMinutes) },
      });
    }

    await logAudit(session.userId, "update", "calendarSchedule", 0, {
      autoEnabled: settings.autoEnabled,
      frequencyMinutes: settings.frequencyMinutes,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
