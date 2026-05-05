import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slugify";

const SLUG_MAX = 60;
const NAME_MAX = 80;

function parseId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
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

// PATCH — rename a tag's slug and/or displayName. Renaming the slug
// rewrites every BlogPost.tagsJson in the same locale that referenced
// the old slug.
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

    const existing = await prisma.blogTag.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

    const body = (await request.json().catch(() => ({}))) as {
      slug?: unknown;
      displayName?: unknown;
    };

    const data: Record<string, unknown> = {};
    let nextSlug = existing.slug;

    if (body.displayName !== undefined) {
      if (typeof body.displayName !== "string") {
        return NextResponse.json({ error: "displayName must be a string" }, { status: 400 });
      }
      const v = body.displayName.trim();
      if (v.length === 0) {
        return NextResponse.json({ error: "displayName cannot be empty" }, { status: 400 });
      }
      if (v.length > NAME_MAX) {
        return NextResponse.json(
          { error: `displayName must be ${NAME_MAX} characters or fewer` },
          { status: 400 },
        );
      }
      if (v !== existing.displayName) data.displayName = v;
    }

    if (body.slug !== undefined) {
      if (typeof body.slug !== "string") {
        return NextResponse.json({ error: "slug must be a string" }, { status: 400 });
      }
      const s = slugify(body.slug.trim()).slice(0, SLUG_MAX);
      if (s.length === 0) {
        return NextResponse.json({ error: "slug cannot be empty" }, { status: 400 });
      }
      if (s !== existing.slug) {
        const conflict = await prisma.blogTag.findUnique({
          where: { slug_locale: { slug: s, locale: existing.locale } },
        });
        if (conflict && conflict.id !== id) {
          return NextResponse.json(
            { error: `Another ${existing.locale} tag with slug "${s}" exists` },
            { status: 409 },
          );
        }
        data.slug = s;
        nextSlug = s;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    }

    let rewrittenPosts = 0;
    if (data.slug !== undefined && nextSlug !== existing.slug) {
      const posts = await prisma.blogPost.findMany({
        where: { locale: existing.locale },
        select: { id: true, tagsJson: true },
      });
      for (const p of posts) {
        const tags = parseTags(p.tagsJson);
        if (!tags.includes(existing.slug)) continue;
        const next = tags.map((t) => (t === existing.slug ? nextSlug : t));
        await prisma.blogPost.update({
          where: { id: p.id },
          data: { tagsJson: JSON.stringify(next), updatedAt: new Date() },
        });
        rewrittenPosts += 1;
      }
    }

    const updated = await prisma.blogTag.update({ where: { id }, data });
    await logAudit(auth.session.userId, "update", "blogTag", id, {
      previousSlug: existing.slug,
      slug: updated.slug,
      previousDisplayName: existing.displayName,
      displayName: updated.displayName,
      locale: updated.locale,
      rewrittenPosts,
    });

    return NextResponse.json({
      id: updated.id,
      slug: updated.slug,
      displayName: updated.displayName,
      locale: updated.locale,
      rewrittenPosts,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — remove the tag entry. Posts referencing this tag have their
// tagsJson rewritten to drop the slug; the posts themselves stay intact.
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

    const existing = await prisma.blogTag.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

    const posts = await prisma.blogPost.findMany({
      where: { locale: existing.locale },
      select: { id: true, tagsJson: true },
    });
    let rewrittenPosts = 0;
    for (const p of posts) {
      const tags = parseTags(p.tagsJson);
      if (!tags.includes(existing.slug)) continue;
      const next = tags.filter((t) => t !== existing.slug);
      await prisma.blogPost.update({
        where: { id: p.id },
        data: { tagsJson: JSON.stringify(next), updatedAt: new Date() },
      });
      rewrittenPosts += 1;
    }

    await prisma.blogTag.delete({ where: { id } });
    await logAudit(auth.session.userId, "delete", "blogTag", id, {
      slug: existing.slug,
      displayName: existing.displayName,
      locale: existing.locale,
      rewrittenPosts,
    });

    return NextResponse.json({ ok: true, rewrittenPosts });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
