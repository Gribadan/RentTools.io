import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { setSetting } from "@/lib/site-settings";

// Keys the admin panel is allowed to read/write. Anything outside this
// set is rejected so the endpoint can't be used as a generic write
// channel into the SiteSetting table.
const ALLOWED_KEYS = new Set([
  "signup_enabled",
  "extraction_per_user_daily_limit",
  "landing_announcement",
  "support_email",
]);

export async function GET() {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: Array.from(ALLOWED_KEYS) } },
      select: { key: true, value: true, updatedAt: true },
    });
    const map: Record<string, { value: string; updatedAt: string | null }> = {};
    for (const r of rows) {
      map[r.key] = { value: r.value, updatedAt: r.updatedAt?.toISOString() ?? null };
    }
    return NextResponse.json(map);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as { key?: unknown; value?: unknown };
    const key = typeof body.key === "string" ? body.key : "";
    const value = typeof body.value === "string" ? body.value : "";
    if (!key || !ALLOWED_KEYS.has(key)) {
      return NextResponse.json({ error: "Unknown key" }, { status: 400 });
    }
    if (key === "extraction_per_user_daily_limit") {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        return NextResponse.json({ error: "Limit must be a non-negative integer" }, { status: 400 });
      }
    }
    if (key === "signup_enabled" && value !== "true" && value !== "false") {
      return NextResponse.json({ error: "signup_enabled must be 'true' or 'false'" }, { status: 400 });
    }
    await setSetting(key, value);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
