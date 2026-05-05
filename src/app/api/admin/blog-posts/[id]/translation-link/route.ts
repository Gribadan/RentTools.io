import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// RT-20.3 tick 2 — pair two BlogPosts as translations of one another.
// Each post stores translationGroupId; the public /blog/[slug] page
// joins on this id to render "Read in Russian" / "Read in English".
//
// POST { otherPostId } — link this post to otherPostId. Both posts'
//   translationGroupId is set to a shared group id. The other post must
//   exist and have a different locale; same locale is rejected (a "ru
//   translation of itself" makes no sense).
//
// DELETE — clear translationGroupId on this post only. Sister post
//   keeps its id, so it remains discoverable via the same group id by
//   any future call.

function parseId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const { id: idStr } = await params;
    const id = parseId(idStr);
    if (id === null) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = (await request.json().catch(() => ({}))) as { otherPostId?: unknown };
    const otherId = typeof body.otherPostId === "number" ? body.otherPostId : Number(body.otherPostId);
    if (!Number.isInteger(otherId) || otherId <= 0 || otherId === id) {
      return NextResponse.json({ error: "Invalid otherPostId" }, { status: 400 });
    }

    const [self, other] = await Promise.all([
      prisma.blogPost.findUnique({ where: { id } }),
      prisma.blogPost.findUnique({ where: { id: otherId } }),
    ]);
    if (!self) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (!other) return NextResponse.json({ error: "Translation post not found" }, { status: 404 });
    if (self.locale === other.locale) {
      return NextResponse.json(
        { error: "Translation pair must be in different locales" },
        { status: 400 },
      );
    }

    // Pick / reuse a group id. If either post already belongs to a
    // group, reuse it (so existing siblings stay linked); otherwise mint
    // a new id. Using `self.id` as the new group id keeps it stable and
    // unique without a separate sequence.
    const groupId = self.translationGroupId ?? other.translationGroupId ?? self.id;

    await prisma.$transaction([
      prisma.blogPost.update({
        where: { id },
        data: { translationGroupId: groupId, updatedAt: new Date() },
      }),
      prisma.blogPost.update({
        where: { id: otherId },
        data: { translationGroupId: groupId, updatedAt: new Date() },
      }),
    ]);

    await logAudit(auth.session.userId, "update", "blogPost", id, {
      slug: self.slug,
      locale: self.locale,
      changed: ["translationGroupId"],
      linkedTo: otherId,
    });
    await logAudit(auth.session.userId, "update", "blogPost", otherId, {
      slug: other.slug,
      locale: other.locale,
      changed: ["translationGroupId"],
      linkedTo: id,
    });

    return NextResponse.json({ success: true, translationGroupId: groupId });
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

    if (existing.translationGroupId === null) {
      return NextResponse.json({ success: true, alreadyUnlinked: true });
    }

    await prisma.blogPost.update({
      where: { id },
      data: { translationGroupId: null, updatedAt: new Date() },
    });

    await logAudit(auth.session.userId, "update", "blogPost", id, {
      slug: existing.slug,
      locale: existing.locale,
      changed: ["translationGroupId"],
      unlinkedFromGroup: existing.translationGroupId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
