import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { getSetting } from "@/lib/site-settings";
import { logAudit } from "@/lib/audit";

const ONBOARD_COOKIE = "rt-onboard-token";

interface DraftLink {
  platform: string;
  icalExportUrl: string;
}

function isLinkArray(value: unknown): value is DraftLink[] {
  return (
    Array.isArray(value) &&
    value.every(
      (l) =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as { platform?: unknown }).platform === "string" &&
        typeof (l as { icalExportUrl?: unknown }).icalExportUrl === "string",
    )
  );
}

export async function POST(request: NextRequest) {
  try {
    const signupEnabled = await getSetting("signup_enabled", "true");
    if (signupEnabled !== "true") {
      return NextResponse.json(
        { error: "Signups are temporarily disabled" },
        { status: 403 }
      );
    }

    // Rate limit signup separately from login: 5 attempts per IP per minute
    const ip = clientIp(request);
    const rl = checkRateLimit(`signup:${ip}`, 5, 60);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many signup attempts. Try again in ${rl.resetSeconds}s.` },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.resetSeconds),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const { username, password } = await request.json();

    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const trimmed = username.trim();
    if (trimmed.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { username: trimmed } });
    if (existing) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username: trimmed, password: hashedPassword, role: "user" },
      select: { id: true, username: true, role: true },
    });

    await createSession(user.id, user.username, user.role);
    await claimOnboardingDraft(user.id);

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * If the visitor has an unclaimed onboarding draft cookie, materialise its
 * propertyName + links as a real Property + CalendarLink rows for the new
 * user. Best-effort: any failure here is logged but doesn't break signup,
 * since the user can re-create the property manually from the dashboard.
 */
async function claimOnboardingDraft(userId: number): Promise<void> {
  try {
    const jar = await cookies();
    const token = jar.get(ONBOARD_COOKIE)?.value;
    if (!token) return;

    const draft = await prisma.onboardingDraft.findUnique({ where: { sessionToken: token } });
    if (!draft || draft.claimedByUserId) {
      jar.delete(ONBOARD_COOKIE);
      return;
    }

    const parsedLinks = parseLinks(draft.links);
    const propertyName = draft.propertyName.trim() || "My first property";

    const property = await prisma.property.create({
      data: { name: propertyName, userId },
    });
    await logAudit(userId, "create", "property", property.id, { name: property.name, fromOnboarding: true });

    for (const link of parsedLinks) {
      if (!link.icalExportUrl.trim()) continue;
      try {
        const created = await prisma.calendarLink.create({
          data: {
            propertyId: property.id,
            platform: link.platform,
            icalExportUrl: link.icalExportUrl.trim(),
          },
        });
        await logAudit(userId, "create", "calendarLink", created.id, {
          platform: link.platform,
          propertyId: property.id,
          fromOnboarding: true,
        });
      } catch {
        // Bad URL or schema-rejected platform — skip but keep the property.
      }
    }

    await prisma.onboardingDraft.update({
      where: { id: draft.id },
      data: { claimedByUserId: userId, claimedAt: new Date() },
    });

    jar.delete(ONBOARD_COOKIE);
  } catch (err) {
    console.error("Onboarding claim failed:", err);
  }
}

function parseLinks(raw: string): DraftLink[] {
  try {
    const parsed = JSON.parse(raw);
    return isLinkArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
