import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { invalidatePlatformCache } from "@/lib/platforms";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// PUT — partial update of an existing platform. Slug is the lookup key
// and is intentionally not editable (it's baked into existing
// CalendarLink rows + outbound feed URLs). Seeded baseline rows
// (isCustom=false) can be edited (color, name, sort, enabled) but
// cannot be deleted — DELETE returns 400 for those.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const { slug } = await params;
    const existing = await prisma.calendarPlatform.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Platform not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      displayName?: unknown;
      color?: unknown;
      iconUrl?: unknown;
      defaultBufferBefore?: unknown;
      defaultBufferAfter?: unknown;
      sortOrder?: unknown;
      enabled?: unknown;
    };

    const data: Record<string, unknown> = {};

    if (body.displayName !== undefined) {
      const v = typeof body.displayName === "string" ? body.displayName.trim() : "";
      if (!v || v.length > 64) {
        return NextResponse.json(
          { error: "Display name must be 1–64 chars" },
          { status: 400 },
        );
      }
      data.displayName = v;
    }

    if (body.color !== undefined) {
      const v = typeof body.color === "string" ? body.color : "";
      if (!HEX_COLOR_RE.test(v)) {
        return NextResponse.json(
          { error: "Color must be a 6-digit hex (e.g. #FF385C)" },
          { status: 400 },
        );
      }
      data.color = v;
    }

    if (body.iconUrl !== undefined) {
      const raw = typeof body.iconUrl === "string" ? body.iconUrl.trim() : "";
      data.iconUrl = raw.length > 0 ? raw.slice(0, 512) : null;
    }

    if (body.defaultBufferBefore !== undefined) {
      const v = clampBuffer(body.defaultBufferBefore);
      if (v === null) {
        return NextResponse.json(
          { error: "defaultBufferBefore must be an integer 0–14" },
          { status: 400 },
        );
      }
      data.defaultBufferBefore = v;
    }

    if (body.defaultBufferAfter !== undefined) {
      const v = clampBuffer(body.defaultBufferAfter);
      if (v === null) {
        return NextResponse.json(
          { error: "defaultBufferAfter must be an integer 0–14" },
          { status: 400 },
        );
      }
      data.defaultBufferAfter = v;
    }

    if (body.sortOrder !== undefined) {
      const v = clampSortOrder(body.sortOrder);
      if (v === null) {
        return NextResponse.json(
          { error: "sortOrder must be an integer 0–9999" },
          { status: 400 },
        );
      }
      data.sortOrder = v;
    }

    if (body.enabled !== undefined) {
      if (typeof body.enabled !== "boolean") {
        return NextResponse.json(
          { error: "enabled must be a boolean" },
          { status: 400 },
        );
      }
      data.enabled = body.enabled;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No editable fields provided" },
        { status: 400 },
      );
    }

    data.updatedAt = new Date();

    const updated = await prisma.calendarPlatform.update({
      where: { slug },
      data,
    });

    invalidatePlatformCache();
    await logAudit(auth.session.userId, "update", "platform", existing.id, {
      slug,
      changed: Object.keys(data).filter((k) => k !== "updatedAt"),
    });

    return NextResponse.json({
      id: updated.id,
      slug: updated.slug,
      displayName: updated.displayName,
      color: updated.color,
      iconUrl: updated.iconUrl,
      defaultBufferBefore: updated.defaultBufferBefore,
      defaultBufferAfter: updated.defaultBufferAfter,
      importInstructionsKey: updated.importInstructionsKey,
      exportInstructionsKey: updated.exportInstructionsKey,
      isCustom: updated.isCustom,
      enabled: updated.enabled,
      sortOrder: updated.sortOrder,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — only custom presets can be removed. Seeded baselines stay
// because existing CalendarLink rows reference them by slug; deleting
// would orphan colors / display names everywhere they appear.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const { slug } = await params;
    const existing = await prisma.calendarPlatform.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Platform not found" }, { status: 404 });
    }
    if (!existing.isCustom) {
      return NextResponse.json(
        { error: "Built-in presets cannot be deleted. Disable instead." },
        { status: 400 },
      );
    }

    const linkCount = await prisma.calendarLink.count({ where: { platform: slug } });
    if (linkCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${linkCount} calendar link(s) still use "${slug}". Disable the preset instead.`,
        },
        { status: 409 },
      );
    }

    await prisma.calendarPlatform.delete({ where: { slug } });
    invalidatePlatformCache();
    await logAudit(auth.session.userId, "delete", "platform", existing.id, { slug });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function clampBuffer(input: unknown): number | null {
  const n = Number(input);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  if (n < 0 || n > 14) return null;
  return n;
}

function clampSortOrder(input: unknown): number | null {
  const n = Number(input);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  if (n < 0 || n > 9999) return null;
  return n;
}
