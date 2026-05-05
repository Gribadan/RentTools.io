import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "node:crypto";
import { slugWithSuffix } from "@/lib/slugify";

const COOKIE_NAME = "rt-onboard-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

interface DraftLink {
  platform: string;          // canonical slug — "airbnb", "booking", "vrbo", "custom"
  customName?: string;       // free-form display name when platform === "custom"
  color?: string;            // 7-char hex (#rrggbb) chosen by user or auto-assigned
  icalExportUrl: string;
  lastTestStatus?: "valid" | "invalid";
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

function sanitizeLink(l: DraftLink): DraftLink {
  const out: DraftLink = {
    platform: l.platform.toLowerCase().trim().slice(0, 32),
    icalExportUrl: l.icalExportUrl.trim().slice(0, 2000),
  };
  if (l.customName) out.customName = l.customName.trim().slice(0, 80);
  if (l.color && /^#[0-9a-fA-F]{6}$/.test(l.color)) out.color = l.color.toLowerCase();
  if (l.lastTestStatus === "valid" || l.lastTestStatus === "invalid") {
    out.lastTestStatus = l.lastTestStatus;
  }
  return out;
}

// GET /api/onboard — read the current draft for this visitor
export async function GET() {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ draft: null });

    const draft = await prisma.onboardingDraft.findUnique({
      where: { sessionToken: token },
      select: {
        id: true,
        sessionToken: true,
        propertyName: true,
        feedSlug: true,
        links: true,
        claimedByUserId: true,
        createdAt: true,
      },
    });
    if (!draft) return NextResponse.json({ draft: null });
    return NextResponse.json({
      draft: {
        ...draft,
        links: safeParseLinks(draft.links),
      },
    });
  } catch (err) {
    console.error("Onboard GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/onboard — create or update the draft for this visitor.
// On first call we mint both a sessionToken (for cookie auth) AND a
// feedSlug (for the durable URL we hand the user). Both are stable;
// the slug is what propagates to the materialised Property after signup.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const propertyName =
      typeof body?.propertyName === "string" ? body.propertyName.trim().slice(0, 200) : "";
    const linksInput: DraftLink[] = isLinkArray(body?.links)
      ? body.links.filter((l: DraftLink) => l.platform && l.icalExportUrl).map(sanitizeLink)
      : [];

    const jar = await cookies();
    let token = jar.get(COOKIE_NAME)?.value;
    let draft = token
      ? await prisma.onboardingDraft.findUnique({ where: { sessionToken: token } })
      : null;

    if (!draft || draft.claimedByUserId) {
      // Mint a new token + slug if missing or the previous draft was claimed.
      token = randomBytes(24).toString("base64url");
      const feedSlug = await mintUniqueSlug(propertyName);
      draft = await prisma.onboardingDraft.create({
        data: {
          sessionToken: token,
          propertyName,
          feedSlug,
          links: JSON.stringify(linksInput),
        },
      });
      jar.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
    } else {
      // Slug never changes once minted — even if propertyName is renamed,
      // the URL we already handed the user must keep working.
      let feedSlug = draft.feedSlug;
      if (!feedSlug) {
        feedSlug = await mintUniqueSlug(propertyName || draft.propertyName);
      }
      draft = await prisma.onboardingDraft.update({
        where: { id: draft.id },
        data: {
          propertyName: propertyName || draft.propertyName,
          feedSlug,
          links: JSON.stringify(linksInput),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      draft: {
        id: draft.id,
        sessionToken: draft.sessionToken,
        propertyName: draft.propertyName,
        feedSlug: draft.feedSlug,
        links: safeParseLinks(draft.links),
        createdAt: draft.createdAt,
      },
    });
  } catch (err) {
    console.error("Onboard POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function safeParseLinks(raw: string): DraftLink[] {
  try {
    const parsed = JSON.parse(raw);
    return isLinkArray(parsed) ? parsed.map(sanitizeLink) : [];
  } catch {
    return [];
  }
}

/**
 * Pick a feedSlug that doesn't collide with an existing Property OR
 * OnboardingDraft. Try up to 5 variations; if all collide (one in a
 * billion), fall back to a random-only slug.
 */
async function mintUniqueSlug(propertyName: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = slugWithSuffix(propertyName);
    const [propHit, draftHit] = await Promise.all([
      prisma.property.findUnique({ where: { feedSlug: candidate }, select: { id: true } }),
      prisma.onboardingDraft.findUnique({ where: { feedSlug: candidate }, select: { id: true } }),
    ]);
    if (!propHit && !draftHit) return candidate;
  }
  // Pure-random fallback — slug-from-name failed 5 times somehow.
  return slugWithSuffix("");
}
