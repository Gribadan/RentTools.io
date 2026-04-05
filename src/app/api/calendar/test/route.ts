import { NextRequest, NextResponse } from "next/server";
import { parseICal } from "@/lib/ical";

/**
 * POST /api/calendar/test
 * Test an iCal URL — fetch it, parse it, return results.
 */
export async function POST(request: NextRequest) {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "RentTool-CalendarSync/1.0",
        Accept: "text/calendar, text/plain, */*",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
      });
    }

    const text = await res.text();

    if (!text.includes("VCALENDAR")) {
      return NextResponse.json({
        success: false,
        error: "Response is not a valid iCal feed",
        preview: text.substring(0, 200),
      });
    }

    const events = parseICal(text);
    const today = new Date().toISOString().substring(0, 10);
    const future = events.filter((e) => e.endDate >= today);
    const past = events.filter((e) => e.endDate < today);

    return NextResponse.json({
      success: true,
      totalEvents: events.length,
      futureEvents: future.length,
      pastEvents: past.length,
      events: future.slice(0, 20).map((e) => ({
        summary: e.summary || "Blocked",
        startDate: e.startDate,
        endDate: e.endDate,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: false,
      error: msg.includes("abort") ? "Connection timed out (15s)" : msg,
    });
  }
}
