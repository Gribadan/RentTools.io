import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/calendar/cron-url
 *
 * Returns the full cron URL (with secret) for the current deployment.
 * Used by the Tasks panel to display the URL for external cron services
 * (e.g. cron-job.org). Server-side so the secret never ends up in the
 * client bundle.
 *
 * Auth: superadmin only. The scheduler credential must not reach other users.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const secret = process.env.CRON_SECRET;
    if (!secret || secret === "fallback-secret-change-me") {
      return NextResponse.json({
        url: null,
        configured: false,
        hint: "Set CRON_SECRET in your environment to enable cron URL display.",
      });
    }

    const h = await headers();
    const proto = h.get("x-forwarded-proto") || "https";
    const host = h.get("x-forwarded-host") || h.get("host");
    if (!host) {
      return NextResponse.json({ url: null, configured: true, hint: "No host header" });
    }

    const url = `${proto}://${host}/api/calendar/cron?secret=${encodeURIComponent(secret)}`;
    return NextResponse.json({ url, configured: true }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
