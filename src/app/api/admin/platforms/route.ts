import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  invalidatePlatformCache,
  isValidPlatformSlug,
  normalizePlatformSlug,
} from "@/lib/platforms";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

interface PlatformRow {
  id: number;
  slug: string;
  displayName: string;
  color: string;
  iconUrl: string | null;
  defaultBufferBefore: number;
  defaultBufferAfter: number;
  importInstructionsKey: string | null;
  exportInstructionsKey: string | null;
  isCustom: boolean;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
}

function serialize(row: {
  id: number;
  slug: string;
  displayName: string;
  color: string;
  iconUrl: string | null;
  defaultBufferBefore: number;
  defaultBufferAfter: number;
  importInstructionsKey: string | null;
  exportInstructionsKey: string | null;
  isCustom: boolean;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date | null;
}): PlatformRow {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    color: row.color,
    iconUrl: row.iconUrl,
    defaultBufferBefore: row.defaultBufferBefore,
    defaultBufferAfter: row.defaultBufferAfter,
    importInstructionsKey: row.importInstructionsKey,
    exportInstructionsKey: row.exportInstructionsKey,
    isCustom: row.isCustom,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

// Admin reads bypass the in-process platform cache so the panel reflects
// writes immediately — the 60s cache lag is fine for end users but
// confusing for the operator who just hit Save.
export async function GET() {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const rows = await prisma.calendarPlatform.findMany({
      orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }],
    });
    return NextResponse.json(rows.map(serialize));
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — create a custom platform. Slugs are normalised then validated
// against the canonical [a-z0-9-] form so they can be dropped straight
// into the outbound iCal feed URL `/api/calendar/feed/[id]/for-{slug}.ics`.
export async function POST(request: NextRequest) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as {
      slug?: unknown;
      displayName?: unknown;
      color?: unknown;
      iconUrl?: unknown;
      defaultBufferBefore?: unknown;
      defaultBufferAfter?: unknown;
      sortOrder?: unknown;
    };

    const rawSlug = typeof body.slug === "string" ? body.slug : "";
    const slug = normalizePlatformSlug(rawSlug);
    if (!isValidPlatformSlug(slug)) {
      return NextResponse.json(
        { error: "Slug must be lowercase letters, digits, and dashes (1–32 chars)" },
        { status: 400 },
      );
    }

    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";
    if (!displayName || displayName.length > 64) {
      return NextResponse.json(
        { error: "Display name is required (max 64 chars)" },
        { status: 400 },
      );
    }

    const color = typeof body.color === "string" ? body.color : "#6B7280";
    if (!HEX_COLOR_RE.test(color)) {
      return NextResponse.json(
        { error: "Color must be a 6-digit hex (e.g. #FF385C)" },
        { status: 400 },
      );
    }

    const iconUrl =
      typeof body.iconUrl === "string" && body.iconUrl.trim().length > 0
        ? body.iconUrl.trim().slice(0, 512)
        : null;

    const defaultBufferBefore = clampBuffer(body.defaultBufferBefore, 1);
    const defaultBufferAfter = clampBuffer(body.defaultBufferAfter, 1);
    const sortOrder = clampSortOrder(body.sortOrder, 150);

    const exists = await prisma.calendarPlatform.findUnique({ where: { slug } });
    if (exists) {
      return NextResponse.json(
        { error: `Slug "${slug}" already exists` },
        { status: 409 },
      );
    }

    const created = await prisma.calendarPlatform.create({
      data: {
        slug,
        displayName,
        color,
        iconUrl,
        defaultBufferBefore,
        defaultBufferAfter,
        importInstructionsKey: null,
        exportInstructionsKey: null,
        isCustom: true,
        enabled: true,
        sortOrder,
      },
    });

    invalidatePlatformCache();
    await logAudit(auth.session.userId, "create", "platform", created.id, {
      slug: created.slug,
      displayName: created.displayName,
      color: created.color,
    });

    return NextResponse.json(serialize(created), { status: 201 });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function clampBuffer(input: unknown, fallback: number): number {
  const n = Number(input);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return fallback;
  if (n < 0) return 0;
  if (n > 14) return 14;
  return n;
}

function clampSortOrder(input: unknown, fallback: number): number {
  const n = Number(input);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return fallback;
  if (n < 0) return 0;
  if (n > 9999) return 9999;
  return n;
}
