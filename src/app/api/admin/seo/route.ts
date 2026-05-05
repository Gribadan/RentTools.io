import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { invalidateSeoCache, isValidSeoLocale, normalizeSeoPath } from "@/lib/seo";

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 320;
const URL_MAX = 512;

interface SeoOverrideRow {
  id: number;
  path: string;
  locale: string;
  title: string | null;
  description: string | null;
  ogImage: string | null;
  canonical: string | null;
  createdAt: string;
  updatedAt: string | null;
}

function serialize(row: {
  id: number;
  path: string;
  locale: string;
  title: string | null;
  description: string | null;
  ogImage: string | null;
  canonical: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}): SeoOverrideRow {
  return {
    id: row.id,
    path: row.path,
    locale: row.locale,
    title: row.title,
    description: row.description,
    ogImage: row.ogImage,
    canonical: row.canonical,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

export async function GET() {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const rows = await prisma.seoOverride.findMany({
      orderBy: [{ path: "asc" }, { locale: "asc" }],
    });
    return NextResponse.json(rows.map(serialize));
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — create a new override. (path, locale) is the unique key; if a
// row already exists for the pair the client should call PUT on the
// existing id instead. Returns 409 to surface the conflict.
export async function POST(request: NextRequest) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as {
      path?: unknown;
      locale?: unknown;
      title?: unknown;
      description?: unknown;
      ogImage?: unknown;
      canonical?: unknown;
    };

    const rawPath = typeof body.path === "string" ? body.path : "";
    const path = normalizeSeoPath(rawPath);
    if (path.length === 0 || !path.startsWith("/")) {
      return NextResponse.json({ error: "Path is required (e.g. /about)" }, { status: 400 });
    }

    const rawLocale = typeof body.locale === "string" ? body.locale : "en";
    if (!isValidSeoLocale(rawLocale)) {
      return NextResponse.json({ error: "Locale must be 'en' or 'ru'" }, { status: 400 });
    }

    const title = clampOptionalString(body.title, TITLE_MAX, "title");
    if (title.error) return NextResponse.json({ error: title.error }, { status: 400 });

    const description = clampOptionalString(body.description, DESCRIPTION_MAX, "description");
    if (description.error)
      return NextResponse.json({ error: description.error }, { status: 400 });

    const ogImage = clampOptionalString(body.ogImage, URL_MAX, "ogImage");
    if (ogImage.error) return NextResponse.json({ error: ogImage.error }, { status: 400 });

    const canonical = clampOptionalString(body.canonical, URL_MAX, "canonical");
    if (canonical.error)
      return NextResponse.json({ error: canonical.error }, { status: 400 });

    const exists = await prisma.seoOverride.findUnique({
      where: { path_locale: { path, locale: rawLocale } },
    });
    if (exists) {
      return NextResponse.json(
        { error: `Override for "${path}" (${rawLocale}) already exists` },
        { status: 409 },
      );
    }

    const created = await prisma.seoOverride.create({
      data: {
        path,
        locale: rawLocale,
        title: title.value,
        description: description.value,
        ogImage: ogImage.value,
        canonical: canonical.value,
      },
    });

    invalidateSeoCache();
    await logAudit(auth.session.userId, "create", "seoOverride", created.id, {
      path,
      locale: rawLocale,
    });

    return NextResponse.json(serialize(created), { status: 201 });
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
