import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slugify";

const SLUG_MAX = 60;
const NAME_MAX = 80;
const VALID_LOCALE = new Set(["en", "ru"]);

// Each BlogPost stores its tags as a JSON array of slug strings under
// `tagsJson`. The canonical BlogTag table holds the (slug, locale,
// displayName) tuple that drives the public tag pages and the admin
// rename / merge tooling. Post counts here are derived by counting
// BlogPosts whose tagsJson contains the tag slug — SQLite has no native
// JSON-contains operator we can rely on cross-driver, so we hydrate
// tagsJson in memory and count with a JS pass. List endpoint volumes
// are bounded by the number of admin-curated tags (low hundreds at
// most) so this is fine.

interface TagRow {
  id: number;
  slug: string;
  displayName: string;
  locale: string;
  postCount: number;
  createdAt: string;
}

async function listTags(): Promise<TagRow[]> {
  const [tags, posts] = await Promise.all([
    prisma.blogTag.findMany({ orderBy: [{ locale: "asc" }, { displayName: "asc" }] }),
    prisma.blogPost.findMany({ select: { locale: true, tagsJson: true } }),
  ]);
  const counts = new Map<string, number>();
  for (const p of posts) {
    let arr: unknown;
    try {
      arr = JSON.parse(p.tagsJson);
    } catch {
      continue;
    }
    if (!Array.isArray(arr)) continue;
    for (const slug of arr) {
      if (typeof slug !== "string") continue;
      const k = `${p.locale}::${slug}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  return tags.map((t) => ({
    id: t.id,
    slug: t.slug,
    displayName: t.displayName,
    locale: t.locale,
    postCount: counts.get(`${t.locale}::${t.slug}`) ?? 0,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function GET() {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;
  try {
    return NextResponse.json(await listTags());
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
      slug?: unknown;
      displayName?: unknown;
      locale?: unknown;
    };

    const rawName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";
    if (rawName.length === 0) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    }
    if (rawName.length > NAME_MAX) {
      return NextResponse.json(
        { error: `Display name must be ${NAME_MAX} characters or fewer` },
        { status: 400 },
      );
    }

    const locale = typeof body.locale === "string" ? body.locale : "en";
    if (!VALID_LOCALE.has(locale)) {
      return NextResponse.json({ error: "Locale must be 'en' or 'ru'" }, { status: 400 });
    }

    const rawSlug = typeof body.slug === "string" ? body.slug.trim() : "";
    const slug = (rawSlug.length > 0 ? slugify(rawSlug) : slugify(rawName)).slice(0, SLUG_MAX);
    if (slug.length === 0) {
      return NextResponse.json({ error: "Could not derive a slug" }, { status: 400 });
    }

    const conflict = await prisma.blogTag.findUnique({
      where: { slug_locale: { slug, locale } },
    });
    if (conflict) {
      return NextResponse.json(
        { error: `A ${locale.toUpperCase()} tag with slug "${slug}" already exists` },
        { status: 409 },
      );
    }

    const created = await prisma.blogTag.create({
      data: { slug, displayName: rawName, locale },
    });
    await logAudit(auth.session.userId, "create", "blogTag", created.id, {
      slug,
      displayName: rawName,
      locale,
    });

    return NextResponse.json(
      {
        id: created.id,
        slug: created.slug,
        displayName: created.displayName,
        locale: created.locale,
        postCount: 0,
        createdAt: created.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
