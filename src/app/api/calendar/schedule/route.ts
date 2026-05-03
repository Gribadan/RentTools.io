import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/calendar/schedule — get sync schedule settings
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await prisma.appSettings.findMany({
      where: { key: { in: ["sync_auto_enabled", "sync_frequency_minutes", "sync_last_run", "sync_last_result"] } },
    });

    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;

    return NextResponse.json({
      autoEnabled: map.sync_auto_enabled === "true",
      frequencyMinutes: parseInt(map.sync_frequency_minutes || "10"),
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

    const body = await request.json();

    if ("autoEnabled" in body) {
      await prisma.appSettings.upsert({
        where: { key: "sync_auto_enabled" },
        update: { value: String(body.autoEnabled) },
        create: { key: "sync_auto_enabled", value: String(body.autoEnabled) },
      });
    }

    if ("frequencyMinutes" in body) {
      await prisma.appSettings.upsert({
        where: { key: "sync_frequency_minutes" },
        update: { value: String(body.frequencyMinutes) },
        create: { key: "sync_frequency_minutes", value: String(body.frequencyMinutes) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
