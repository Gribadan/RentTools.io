import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        tgGroupInviteUrl: true,
        waGroupInviteUrl: true,
      },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// RT-25.13 tick 2 — profile-update endpoint for the messenger group
// invite URLs surfaced in the per-reservation "Send group invite" CTA.
// Validates each URL against its messenger's prefix; an empty string
// clears the field. Other profile mutations still live in their own
// endpoints (change-password, etc.) — we keep PATCH narrow on purpose.
function normaliseInviteUrl(
  raw: unknown,
  prefix: string,
): { ok: true; value: string | null } | { ok: false } {
  if (raw === null || raw === undefined || raw === "") return { ok: true, value: null };
  if (typeof raw !== "string") return { ok: false };
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, value: null };
  if (!trimmed.startsWith(prefix)) return { ok: false };
  // Sanity bound — invite URLs in the wild are < 200 chars; reject obvious junk.
  if (trimmed.length > 500) return { ok: false };
  return { ok: true, value: trimmed };
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const data: { tgGroupInviteUrl?: string | null; waGroupInviteUrl?: string | null } = {};

    if ("tgGroupInviteUrl" in body) {
      const r = normaliseInviteUrl(body.tgGroupInviteUrl, "https://t.me/");
      if (!r.ok) {
        return NextResponse.json(
          { error: "Telegram invite URL must start with https://t.me/" },
          { status: 400 },
        );
      }
      data.tgGroupInviteUrl = r.value;
    }

    if ("waGroupInviteUrl" in body) {
      const r = normaliseInviteUrl(body.waGroupInviteUrl, "https://chat.whatsapp.com/");
      if (!r.ok) {
        return NextResponse.json(
          { error: "WhatsApp invite URL must start with https://chat.whatsapp.com/" },
          { status: 400 },
        );
      }
      data.waGroupInviteUrl = r.value;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No supported fields in request" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        tgGroupInviteUrl: true,
        waGroupInviteUrl: true,
      },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
