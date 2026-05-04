import { NextRequest, NextResponse } from "next/server";
import { syncAllCalendars } from "@/lib/calendar-sync";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/calendar/cron?secret=xxx
 * Called by the system cron on the droplet (scripts/cron-sync.sh) every 10 min.
 * Also accepts Authorization: Bearer <CRON_SECRET> for any external scheduler.
 */
export async function GET(request: NextRequest) {
  const source = request.headers.get("user-agent") || "unknown";

  const secret = request.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET || process.env.JWT_SECRET;
  const bearerOk = request.headers.get("authorization") === `Bearer ${expected}`;

  if (!bearerOk && (!secret || secret !== expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.syncLog.create({
    data: {
      level: "info",
      message: `Cron triggered by ${source.substring(0, 80)}`,
    },
  });

  // Check if auto-sync is enabled
  const autoSetting = await prisma.appSettings.findUnique({
    where: { key: "sync_auto_enabled" },
  });
  if (autoSetting?.value === "false") {
    await prisma.syncLog.create({
      data: { level: "info", message: "Cron skipped: auto-sync disabled" },
    });
    return NextResponse.json({ ok: true, skipped: true, reason: "Auto-sync disabled" });
  }

  // Check frequency
  const freqSetting = await prisma.appSettings.findUnique({
    where: { key: "sync_frequency_minutes" },
  });
  const freqMinutes = parseInt(freqSetting?.value || "10");

  const lastRunSetting = await prisma.appSettings.findUnique({
    where: { key: "sync_last_run" },
  });
  if (lastRunSetting?.value) {
    const lastRun = new Date(lastRunSetting.value);
    const elapsed = (Date.now() - lastRun.getTime()) / 1000 / 60;
    if (elapsed < freqMinutes) {
      await prisma.syncLog.create({
        data: { level: "info", message: `Cron skipped: last run ${Math.floor(elapsed)}m ago (freq: ${freqMinutes}m)` },
      });
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `Last run ${Math.floor(elapsed)}m ago, frequency set to ${freqMinutes}m`,
      });
    }
  }

  try {
    const result = await syncAllCalendars();

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

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    await prisma.syncLog.create({
      data: { level: "error", message: `Cron error: ${msg}` },
    });

    await prisma.appSettings.upsert({
      where: { key: "sync_last_run" },
      update: { value: new Date().toISOString() },
      create: { key: "sync_last_run", value: new Date().toISOString() },
    });
    await prisma.appSettings.upsert({
      where: { key: "sync_last_result" },
      update: { value: JSON.stringify({ error: msg }) },
      create: { key: "sync_last_result", value: JSON.stringify({ error: msg }) },
    });

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
