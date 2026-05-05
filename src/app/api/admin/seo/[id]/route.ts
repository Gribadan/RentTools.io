import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { invalidateSeoCache, isValidSeoLocale, normalizeSeoPath } from "@/lib/seo";

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 320;
const URL_MAX = 512;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id) || !Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.seoOverride.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Override not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      path?: unknown;
      locale?: unknown;
      title?: unknown;
      description?: unknown;
      ogImage?: unknown;
      canonical?: unknown;
    };

    const data: Record<string, unknown> = {};

    // Path / locale changes have to keep the (path, locale) unique
    // constraint clean. Resolve early so we can 409 before mutating.
    let nextPath = existing.path;
    let nextLocale = existing.locale;
    let pairChanged = false;

    if (body.path !== undefined) {
      const rawPath = typeof body.path === "string" ? body.path : "";
      const norm = normalizeSeoPath(rawPath);
      if (norm.length === 0 || !norm.startsWith("/")) {
        return NextResponse.json({ error: "Path is required (e.g. /about)" }, { status: 400 });
      }
      if (norm !== existing.path) {
        nextPath = norm;
        pairChanged = true;
        data.path = norm;
      }
    }

    if (body.locale !== undefined) {
      const v = typeof body.locale === "string" ? body.locale : "";
      if (!isValidSeoLocale(v)) {
        return NextResponse.json({ error: "Locale must be 'en' or 'ru'" }, { status: 400 });
      }
      if (v !== existing.locale) {
        nextLocale = v;
        pairChanged = true;
        data.locale = v;
      }
    }

    if (pairChanged) {
      const conflict = await prisma.seoOverride.findUnique({
        where: { path_locale: { path: nextPath, locale: nextLocale } },
      });
      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: `Another override already exists for "${nextPath}" (${nextLocale})` },
          { status: 409 },
        );
      }
    }

    if (body.title !== undefined) {
      const r = clampOptionalString(body.title, TITLE_MAX, "title");
      if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
      data.title = r.value;
    }
    if (body.description !== undefined) {
      const r = clampOptionalString(body.description, DESCRIPTION_MAX, "description");
      if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
      data.description = r.value;
    }
    if (body.ogImage !== undefined) {
      const r = clampOptionalString(body.ogImage, URL_MAX, "ogImage");
      if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
      data.ogImage = r.value;
    }
    if (body.canonical !== undefined) {
      const r = clampOptionalString(body.canonical, URL_MAX, "canonical");
      if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
      data.canonical = r.value;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    }

    data.updatedAt = new Date();

    const updated = await prisma.seoOverride.update({ where: { id }, data });

    invalidateSeoCache();
    await logAudit(auth.session.userId, "update", "seoOverride", id, {
      path: updated.path,
      locale: updated.locale,
      changed: Object.keys(data).filter((k) => k !== "updatedAt"),
    });

    return NextResponse.json({
      id: updated.id,
      path: updated.path,
      locale: updated.locale,
      title: updated.title,
      description: updated.description,
      ogImage: updated.ogImage,
      canonical: updated.canonical,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id) || !Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.seoOverride.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Override not found" }, { status: 404 });
    }

    await prisma.seoOverride.delete({ where: { id } });
    invalidateSeoCache();
    await logAudit(auth.session.userId, "delete", "seoOverride", id, {
      path: existing.path,
      locale: existing.locale,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function clampOptionalString(
  input: unknown,
  max: number,
  fieldName: string,
): { value: string | null; error?: string } {
  if (input === undefined || input === null) return { value: null };
  if (typeof input !== "string") {
    return { value: null, error: `${fieldName} must be a string` };
  }
  const trimmed = input.trim();
  if (trimmed.length === 0) return { value: null };
  if (trimmed.length > max) {
    return { value: null, error: `${fieldName} must be ≤ ${max} chars` };
  }
  return { value: trimmed };
}
