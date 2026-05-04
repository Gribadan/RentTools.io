import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "node:crypto";

const COOKIE_NAME = "rt-onboard-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

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

// POST /api/onboard — create or update the draft for this visitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const propertyName =
      typeof body?.propertyName === "string" ? body.propertyName.trim().slice(0, 200) : "";
    const linksInput: DraftLink[] = isLinkArray(body?.links)
      ? body.links
          .filter((l: DraftLink) => l.platform && l.icalExportUrl)
          .map((l: DraftLink) => ({
            platform: l.platform.toLowerCase().trim().slice(0, 32),
            icalExportUrl: l.icalExportUrl.trim().slice(0, 2000),
          }))
      : [];

    const jar = await cookies();
    let token = jar.get(COOKIE_NAME)?.value;
    let draft = token
      ? await prisma.onboardingDraft.findUnique({ where: { sessionToken: token } })
      : null;

    if (!draft || draft.claimedByUserId) {
      // Mint a new token if missing or the previous draft was already claimed.
      token = randomBytes(24).toString("base64url");
      draft = await prisma.onboardingDraft.create({
        data: {
          sessionToken: token,
          propertyName,
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
      draft = await prisma.onboardingDraft.update({
        where: { id: draft.id },
        data: {
          propertyName: propertyName || draft.propertyName,
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
    return isLinkArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
