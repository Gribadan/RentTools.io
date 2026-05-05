import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// Merge tag A into tag B. Every BlogPost.tagsJson in the source's locale
// that mentions A's slug gets rewritten with B's slug (deduped, preserving
// order). The source tag is then deleted. Both tags must share a locale —
// merging across locales would silently strip an EN slug from an EN post,
// which is almost never what an admin wants.

function parseTags(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((t): t is string => typeof t === "string");
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      sourceId?: unknown;
      destId?: unknown;
    };
    const sourceId = Number(body.sourceId);
    const destId = Number(body.destId);
    if (!Number.isInteger(sourceId) || sourceId <= 0) {
      return NextResponse.json({ error: "sourceId must be a positive integer" }, { status: 400 });
    }
    if (!Number.isInteger(destId) || destId <= 0) {
      return NextResponse.json({ error: "destId must be a positive integer" }, { status: 400 });
    }
    if (sourceId === destId) {
      return NextResponse.json({ error: "Cannot merge a tag into itself" }, { status: 400 });
    }

    const [source, dest] = await Promise.all([
      prisma.blogTag.findUnique({ where: { id: sourceId } }),
      prisma.blogTag.findUnique({ where: { id: destId } }),
    ]);
    if (!source) return NextResponse.json({ error: "Source tag not found" }, { status: 404 });
    if (!dest) return NextResponse.json({ error: "Destination tag not found" }, { status: 404 });
    if (source.locale !== dest.locale) {
      return NextResponse.json(
        { error: "Source and destination tags must share a locale" },
        { status: 400 },
      );
    }

    const posts = await prisma.blogPost.findMany({
      where: { locale: source.locale },
      select: { id: true, tagsJson: true },
    });
    let rewrittenPosts = 0;
    for (const p of posts) {
      const tags = parseTags(p.tagsJson);
      if (!tags.includes(source.slug)) continue;
      const swapped = tags.map((t) => (t === source.slug ? dest.slug : t));
      const seen = new Set<string>();
      const deduped: string[] = [];
      for (const t of swapped) {
        if (seen.has(t)) continue;
        seen.add(t);
        deduped.push(t);
      }
      await prisma.blogPost.update({
        where: { id: p.id },
        data: { tagsJson: JSON.stringify(deduped), updatedAt: new Date() },
      });
      rewrittenPosts += 1;
    }

    await prisma.blogTag.delete({ where: { id: sourceId } });
    await logAudit(auth.session.userId, "delete", "blogTag", sourceId, {
      mergedInto: dest.id,
      mergedIntoSlug: dest.slug,
      sourceSlug: source.slug,
      locale: source.locale,
      rewrittenPosts,
    });

    return NextResponse.json({ ok: true, rewrittenPosts });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
