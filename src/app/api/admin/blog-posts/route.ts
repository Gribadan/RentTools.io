import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slugify";

// RT-20.3 tick 1 — admin CRUD for BlogPost. tick 2 ships the full
// editor page that PATCHes body/excerpt/tags/ogImage; tick 1 keeps the
// surface tight: list + quick-create draft + status / slug / title /
// locale toggles. The full editor uses the same endpoints.

const TITLE_MAX = 200;
const SLUG_MAX = 80;
const EXCERPT_MAX = 320;

const VALID_LOCALE = new Set(["en", "ru"]);

interface BlogPostListRow {
  id: number;
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  status: string;
  authorId: number;
  authorUsername: string | null;
  tags: string[];
  ogImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  commentCount: number;
}

function parseTags(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((t): t is string => typeof t === "string");
  } catch {
    return [];
  }
}

export async function GET() {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const rows = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { username: true } },
        _count: { select: { comments: true } },
      },
    });

    const list: BlogPostListRow[] = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      locale: r.locale,
      title: r.title,
      excerpt: r.excerpt,
      status: r.status,
      authorId: r.authorId,
      authorUsername: r.author?.username ?? null,
      tags: parseTags(r.tagsJson),
      ogImageUrl: r.ogImageUrl,
      publishedAt: r.publishedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt?.toISOString() ?? null,
      commentCount: r._count.comments,
    }));

    return NextResponse.json(list);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      title?: unknown;
      slug?: unknown;
      locale?: unknown;
      excerpt?: unknown;
    };

    const rawTitle = typeof body.title === "string" ? body.title.trim() : "";
    if (rawTitle.length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (rawTitle.length > TITLE_MAX) {
      return NextResponse.json(
        { error: `Title must be ${TITLE_MAX} characters or fewer` },
        { status: 400 },
      );
    }

    const rawLocale = typeof body.locale === "string" ? body.locale : "en";
    if (!VALID_LOCALE.has(rawLocale)) {
      return NextResponse.json({ error: "Locale must be 'en' or 'ru'" }, { status: 400 });
    }

    // Slug: explicit value if non-empty, otherwise derive from title.
    const rawSlug = typeof body.slug === "string" ? body.slug.trim() : "";
    const slug = (rawSlug.length > 0 ? slugify(rawSlug) : slugify(rawTitle)).slice(0, SLUG_MAX);
    if (slug.length === 0) {
      return NextResponse.json({ error: "Could not derive a slug" }, { status: 400 });
    }

    const rawExcerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
    if (rawExcerpt.length > EXCERPT_MAX) {
      return NextResponse.json(
        { error: `Excerpt must be ${EXCERPT_MAX} characters or fewer` },
        { status: 400 },
      );
    }

    const conflict = await prisma.blogPost.findUnique({
      where: { slug_locale: { slug, locale: rawLocale } },
    });
    if (conflict) {
      return NextResponse.json(
        { error: `A ${rawLocale.toUpperCase()} post with slug "${slug}" already exists` },
        { status: 409 },
      );
    }

    const created = await prisma.blogPost.create({
      data: {
        title: rawTitle,
        slug,
        locale: rawLocale,
        excerpt: rawExcerpt,
        body: "",
        status: "draft",
        authorId: auth.session.userId,
        tagsJson: "[]",
      },
    });

    await logAudit(auth.session.userId, "create", "blogPost", created.id, {
      slug,
      locale: rawLocale,
      title: rawTitle,
    });

    return NextResponse.json(
      {
        id: created.id,
        slug: created.slug,
        locale: created.locale,
        title: created.title,
        excerpt: created.excerpt,
        status: created.status,
        authorId: created.authorId,
        authorUsername: auth.session.username,
        tags: [],
        ogImageUrl: created.ogImageUrl,
        publishedAt: created.publishedAt?.toISOString() ?? null,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt?.toISOString() ?? null,
        commentCount: 0,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

