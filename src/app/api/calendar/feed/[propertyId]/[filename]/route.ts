import { NextRequest, NextResponse } from "next/server";
import { generateFeed } from "@/lib/feed";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

/**
 * GET /api/calendar/feed/[propertyId]/for-airbnb.ics
 * GET /api/calendar/feed/[propertyId]/for-booking.ics
 *
 * Primary .ics feed URL — this is what Airbnb/Booking import.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string; filename: string }> }
) {
  try {
    const { propertyId: pid, filename } = await params;

    // Rate limit: 60 requests per minute per IP per propertyId
    const ip = clientIp(request);
    const rl = checkRateLimit(`feed:${ip}:${pid}`, 60, 60);
    if (!rl.ok) {
      return new NextResponse("Rate limit exceeded", {
        status: 429,
        headers: { "Retry-After": String(rl.resetSeconds) },
      });
    }
    const propertyId = Number(pid);
    const match = filename.match(/^for-(\w+)\.ics$/i);
    const forPlatform = match?.[1] || "airbnb";

    if (isNaN(propertyId)) {
      return new NextResponse("Invalid property ID", { status: 400 });
    }

    const result = await generateFeed(propertyId, forPlatform);

    if ("error" in result) {
      return new NextResponse(result.error, { status: result.status });
    }

    return new NextResponse(result.ical, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="calendar-${forPlatform}.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Feed error:", err);
    return new NextResponse(`Error: ${err instanceof Error ? err.message : String(err)}`, { status: 500 });
  }
}
