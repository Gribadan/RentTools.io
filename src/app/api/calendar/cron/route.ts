import { NextRequest, NextResponse } from "next/server";
import { syncAllCalendars } from "@/lib/calendar-sync";
import { syncFrequency } from "@/lib/calendar-schedule";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Share the in-flight guard across route bundles in the single Node process.
const state = globalThis as typeof globalThis & { renttoolsCronRunning?: boolean };

/** GET /api/calendar/cron — authenticated system-wide calendar sync. */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET || process.env.JWT_SECRET;
  const bearerOk = !!expected && request.headers.get("authorization") === `Bearer ${expected}`;
  if (!expected || (!bearerOk && (!secret || secret !== expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (state.renttoolsCronRunning) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Sync already running" });
  }
  state.renttoolsCronRunning = true;
  let started = false;
  try {
    const source = (request.headers.get("user-agent") || "unknown").substring(0, 80);
    await prisma.syncLog.create({ data: { level: "info", message: `Cron triggered by ${source}` } });
    const auto = await prisma.appSettings.findUnique({ where: { key: "sync_auto_enabled" } });
    if (auto?.value === "false") {
      return NextResponse.json({ ok: true, skipped: true, reason: "Auto-sync disabled" });
    }

    const frequency = await prisma.appSettings.findUnique({ where: { key: "sync_frequency_minutes" } });
    const interval = syncFrequency(frequency?.value) * 60_000;
    const lastStart = await prisma.appSettings.findUnique({ where: { key: "sync_last_started" } });
    const now = Date.now();
    const previous = Date.parse(lastStart?.value || "");
    // Compare schedule slots, not elapsed time since completion. A delayed tick
    // must not suppress the following slot. Ignore invalid/future clock values.
    if (Number.isFinite(previous) && previous <= now && Math.floor(previous / interval) === Math.floor(now / interval)) {
      return NextResponse.json({ ok: true, skipped: true, reason: "Schedule slot already started" });
    }

    const start = new Date(now).toISOString();
    await prisma.appSettings.upsert({
      where: { key: "sync_last_started" },
      update: { value: start },
      create: { key: "sync_last_started", value: start },
    });
    started = true;
    const result = await syncAllCalendars();
    await saveCompletion(result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Calendar cron failed:", err);
    if (started) {
      try {
        const message = err instanceof Error ? err.message : String(err);
        await prisma.syncLog.create({ data: { level: "error", message: `Cron error: ${message}` } });
        await saveCompletion({ error: message });
      } catch (logError) {
        console.error("Calendar cron status failed:", logError);
      }
    }
    return NextResponse.json({ error: "Calendar sync failed" }, { status: 500 });
  } finally {
    state.renttoolsCronRunning = false;
  }
}

async function saveCompletion(result: unknown) {
  const completed = new Date().toISOString();
  await prisma.appSettings.upsert({
    where: { key: "sync_last_run" },
    update: { value: completed },
    create: { key: "sync_last_run", value: completed },
  });
  const value = JSON.stringify(result);
  await prisma.appSettings.upsert({
    where: { key: "sync_last_result" },
    update: { value },
    create: { key: "sync_last_result", value },
  });
}
