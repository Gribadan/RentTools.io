import { NextRequest, NextResponse } from "next/server";
import { syncAllCalendars } from "@/lib/calendar-sync";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/calendar/cron?secret=xxx
 *
 * Called periodically by an external cron service.
 * Respects auto-mode toggle and frequency settings.
 */
export async function GET(request: NextRequest) {
  // Auth: query param secret OR Vercel's cron auth header
  const secret = request.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET || process.env.JWT_SECRET;
  const vercelCron = request.headers.get("authorization") === `Bearer ${expected}`;

  if (!vercelCron && (!secret || secret !== expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if auto-sync is enabled
  const autoSetting = await prisma.appSettings.findUnique({
    where: { key: "sync_auto_enabled" },
  });
  if (autoSetting?.value === "false") {
    return NextResponse.json({ ok: true, skipped: true, reason: "Auto-sync disabled" });
  }

  // Check frequency — don't run more often than configured
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
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `Last run ${Math.floor(elapsed)}m ago, frequency set to ${freqMinutes}m`,
      });
    }
  }

  try {
    const result = await syncAllCalendars();

    // Record run time and result
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
