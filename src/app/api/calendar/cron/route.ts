import { NextRequest, NextResponse } from "next/server";
import { syncAllCalendars } from "@/lib/calendar-sync";

/**
 * GET /api/calendar/cron?secret=xxx
 *
 * Called every 10 minutes by an external cron (system crontab, Vercel cron, etc.)
 * Protected by a secret token to prevent abuse.
 *
 * Setup options:
 *
 * 1. System crontab:
 *    * /10 * * * * curl -s "https://your-domain.com/api/calendar/cron?secret=YOUR_SECRET"
 *
 * 2. Vercel cron (vercel.json):
 *    { "crons": [{ "path": "/api/calendar/cron?secret=YOUR_SECRET", "schedule": "* /10 * * * *" }] }
 *
 * 3. Any external cron service (cron-job.org, etc.)
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET || process.env.JWT_SECRET;

  if (!secret || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllCalendars();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
