import { NextRequest, NextResponse } from "next/server";
import { generateFeed } from "@/lib/feed";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { timingSafeEqual } from "node:crypto";

/**
 * GET /api/calendar/feed/[propertyId]/for-airbnb.ics
 * GET /api/calendar/feed/[propertyId]/for-booking.ics
 *
 * Primary .ics feed URL — this is what Airbnb/Booking import.
 *
 * If the property has a feedToken set, the request must include
 * ?token=<value> matching it; otherwise we return 401. Properties
 * without a token (legacy) keep working publicly until the user
 * opts in via the rotate-feed-token endpoint.
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

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { feedToken: true },
    });
    if (!property) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (property.feedToken) {
      const provided = request.nextUrl.searchParams.get("token") ?? "";
      if (!tokensMatch(provided, property.feedToken)) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
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

function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
