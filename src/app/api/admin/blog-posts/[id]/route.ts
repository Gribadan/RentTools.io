import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slugify";

const TITLE_MAX = 200;
const SLUG_MAX = 80;
const EXCERPT_MAX = 320;
const BODY_MAX = 200_000;
const OG_URL_MAX = 512;

const VALID_STATUS = new Set(["draft", "published", "archived"]);
const VALID_LOCALE = new Set(["en", "ru"]);

function parseTags(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((t): t is string => typeof t === "string");
  } catch {
    return [];
  }
}

function parseId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const { id: idStr } = await params;
    const id = parseId(idStr);
    if (id === null) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const row = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: { username: true } },
        _count: { select: { comments: true } },
      },
    });
    if (!row) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    let translationSibling: {
      id: number;
      slug: string;
      locale: string;
      title: string;
      status: string;
    } | null = null;
    if (row.translationGroupId !== null) {
      const sib = await prisma.blogPost.findFirst({
        where: { translationGroupId: row.translationGroupId, id: { not: row.id } },
        select: { id: true, slug: true, locale: true, title: true, status: true },
      });
      translationSibling = sib;
    }

    return NextResponse.json({
      id: row.id,
      slug: row.slug,
      locale: row.locale,
      title: row.title,
      excerpt: row.excerpt,
      body: row.body,
      status: row.status,
      authorId: row.authorId,
      authorUsername: row.author?.username ?? null,
      tags: parseTags(row.tagsJson),
      ogImageUrl: row.ogImageUrl,
      translationGroupId: row.translationGroupId,
      translationSibling,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt?.toISOString() ?? null,
      commentCount: row._count.comments,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — partial update. Any subset of {title, slug, locale, excerpt,
// body, status, tags, ogImageUrl, publishedAt} can be sent. Slug / locale
// changes are validated against the (slug, locale) unique key.
//
// Status transition: changing status to "published" auto-stamps
// publishedAt = now() if not previously set; archived / draft do not
// clear publishedAt (the post may have been live before).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const { id: idStr } = await params;
    const id = parseId(idStr);
    if (id === null) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const body = (await request.json().catch(() => ({}))) as {
      title?: unknown;
      slug?: unknown;
      locale?: unknown;
      excerpt?: unknown;
      body?: unknown;
      status?: unknown;
      tags?: unknown;
      ogImageUrl?: unknown;
      publishedAt?: unknown;
    };

    const data: Record<string, unknown> = {};
    const changed: string[] = [];

    if (body.title !== undefined) {
      if (typeof body.title !== "string") {
        return NextResponse.json({ error: "Title must be a string" }, { status: 400 });
      }
      const t = body.title.trim();
      if (t.length === 0) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      if (t.length > TITLE_MAX) {
        return NextResponse.json(
          { error: `Title must be ${TITLE_MAX} characters or fewer` },
          { status: 400 },
        );
      }
      if (t !== existing.title) {
        data.title = t;
        changed.push("title");
      }
    }

    if (body.excerpt !== undefined) {
      if (typeof body.excerpt !== "string") {
        return NextResponse.json({ error: "Excerpt must be a string" }, { status: 400 });
      }
      const e = body.excerpt.trim();
      if (e.length > EXCERPT_MAX) {
        return NextResponse.json(
          { error: `Excerpt must be ${EXCERPT_MAX} characters or fewer` },
          { status: 400 },
        );
      }
      if (e !== existing.excerpt) {
        data.excerpt = e;
        changed.push("excerpt");
      }
    }

    if (body.body !== undefined) {
      if (typeof body.body !== "string") {
        return NextResponse.json({ error: "Body must be a string" }, { status: 400 });
      }
      if (body.body.length > BODY_MAX) {
        return NextResponse.json(
          { error: `Body must be ${BODY_MAX} characters or fewer` },
          { status: 400 },
        );
      }
      if (body.body !== existing.body) {
        data.body = body.body;
        changed.push("body");
      }
    }

    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags) || !body.tags.every((t) => typeof t === "string")) {
        return NextResponse.json({ error: "tags must be an array of strings" }, { status: 400 });
      }
      const cleaned = (body.tags as string[])
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0)
        .slice(0, 20);
      const tagsJson = JSON.stringify(cleaned);
      if (tagsJson !== existing.tagsJson) {
        data.tagsJson = tagsJson;
        changed.push("tags");
      }
    }

    if (body.ogImageUrl !== undefined) {
      if (body.ogImageUrl !== null && typeof body.ogImageUrl !== "string") {
        return NextResponse.json({ error: "ogImageUrl must be a string or null" }, { status: 400 });
      }
      const v = typeof body.ogImageUrl === "string" ? body.ogImageUrl.trim() : "";
      if (v.length > OG_URL_MAX) {
        return NextResponse.json(
          { error: `OG image URL must be ${OG_URL_MAX} characters or fewer` },
          { status: 400 },
        );
      }
      const next = v.length === 0 ? null : v;
      if (next !== existing.ogImageUrl) {
        data.ogImageUrl = next;
        changed.push("ogImageUrl");
      }
    }

    // (slug, locale) changes have to keep the unique key clean. Resolve
    // both, then 409 on conflict before mutating.
    let nextSlug = existing.slug;
    let nextLocale = existing.locale;
    let pairChanged = false;

    if (body.slug !== undefined) {
      if (typeof body.slug !== "string") {
        return NextResponse.json({ error: "Slug must be a string" }, { status: 400 });
      }
      const s = slugify(body.slug.trim()).slice(0, SLUG_MAX);
      if (s.length === 0) {
        return NextResponse.json({ error: "Slug cannot be empty" }, { status: 400 });
      }
      if (s !== existing.slug) {
        nextSlug = s;
        pairChanged = true;
        data.slug = s;
        changed.push("slug");
      }
    }

    if (body.locale !== undefined) {
      if (typeof body.locale !== "string" || !VALID_LOCALE.has(body.locale)) {
        return NextResponse.json({ error: "Locale must be 'en' or 'ru'" }, { status: 400 });
      }
      if (body.locale !== existing.locale) {
        nextLocale = body.locale;
        pairChanged = true;
        data.locale = body.locale;
        changed.push("locale");
      }
    }

    if (pairChanged) {
      const conflict = await prisma.blogPost.findUnique({
        where: { slug_locale: { slug: nextSlug, locale: nextLocale } },
      });
      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: `Another post already exists at "${nextSlug}" (${nextLocale})` },
          { status: 409 },
        );
      }
    }

    if (body.status !== undefined) {
      if (typeof body.status !== "string" || !VALID_STATUS.has(body.status)) {
        return NextResponse.json(
          { error: "Status must be draft, published, or archived" },
          { status: 400 },
        );
      }
      if (body.status !== existing.status) {
        data.status = body.status;
        changed.push("status");
        // Auto-stamp publishedAt the first time a post goes published.
        if (body.status === "published" && existing.publishedAt === null) {
          data.publishedAt = new Date();
        }
      }
    }

    if (body.publishedAt !== undefined) {
      if (body.publishedAt === null) {
        if (existing.publishedAt !== null) {
          data.publishedAt = null;
          changed.push("publishedAt");
        }
      } else if (typeof body.publishedAt === "string") {
        const d = new Date(body.publishedAt);
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json({ error: "publishedAt must be a valid ISO date" }, { status: 400 });
        }
        if (existing.publishedAt === null || d.getTime() !== existing.publishedAt.getTime()) {
          data.publishedAt = d;
          changed.push("publishedAt");
        }
      } else {
        return NextResponse.json({ error: "publishedAt must be ISO string or null" }, { status: 400 });
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    }

    data.updatedAt = new Date();

    const updated = await prisma.blogPost.update({
      where: { id },
      data,
      include: {
        author: { select: { username: true } },
        _count: { select: { comments: true } },
      },
    });

    await logAudit(auth.session.userId, "update", "blogPost", id, {
      slug: updated.slug,
      locale: updated.locale,
      changed,
    });

    return NextResponse.json({
      id: updated.id,
      slug: updated.slug,
      locale: updated.locale,
      title: updated.title,
      excerpt: updated.excerpt,
      body: updated.body,
      status: updated.status,
      authorId: updated.authorId,
      authorUsername: updated.author?.username ?? null,
      tags: parseTags(updated.tagsJson),
      ogImageUrl: updated.ogImageUrl,
      translationGroupId: updated.translationGroupId,
      publishedAt: updated.publishedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt?.toISOString() ?? null,
      commentCount: updated._count.comments,
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
    const id = parseId(idStr);
    if (id === null) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    await prisma.blogPost.delete({ where: { id } });

    await logAudit(auth.session.userId, "delete", "blogPost", id, {
      slug: existing.slug,
      locale: existing.locale,
      title: existing.title,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
