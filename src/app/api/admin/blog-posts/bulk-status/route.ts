import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const VALID_STATUS = new Set(["draft", "published", "archived"]);
const MAX_IDS = 100;

// Bulk-flip status across many posts in a single request. Drives the
// shift-click + "Publish selected" UI on the admin Posts list. Each
// post is updated atomically and audit-logged independently so the
// AuditLog reflects per-post changes (matches the shape of single-row
// PATCHes from /api/admin/blog-posts/[id]).
export async function POST(request: NextRequest) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      ids?: unknown;
      status?: unknown;
    };

    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
    }
    if (body.ids.length > MAX_IDS) {
      return NextResponse.json(
        { error: `Cannot bulk-update more than ${MAX_IDS} posts at once` },
        { status: 400 },
      );
    }
    const ids: number[] = [];
    for (const raw of body.ids) {
      const n = Number(raw);
      if (!Number.isInteger(n) || n <= 0) {
        return NextResponse.json({ error: "Each id must be a positive integer" }, { status: 400 });
      }
      ids.push(n);
    }

    if (typeof body.status !== "string" || !VALID_STATUS.has(body.status)) {
      return NextResponse.json(
        { error: "status must be draft, published, or archived" },
        { status: 400 },
      );
    }
    const status = body.status;

    const existing = await prisma.blogPost.findMany({
      where: { id: { in: ids } },
      select: { id: true, slug: true, locale: true, status: true, publishedAt: true },
    });
    const existingMap = new Map(existing.map((p) => [p.id, p]));

    let updatedCount = 0;
    const skipped: number[] = [];

    for (const id of ids) {
      const row = existingMap.get(id);
      if (!row) {
        skipped.push(id);
        continue;
      }
      if (row.status === status) continue;

      const data: Record<string, unknown> = { status, updatedAt: new Date() };
      if (status === "published" && row.publishedAt === null) {
        data.publishedAt = new Date();
      }
      await prisma.blogPost.update({ where: { id }, data });
      await logAudit(auth.session.userId, "update", "blogPost", id, {
        slug: row.slug,
        locale: row.locale,
        changed: ["status"],
        previousStatus: row.status,
        status,
        bulk: true,
      });
      updatedCount += 1;
    }

    return NextResponse.json({ ok: true, updated: updatedCount, skipped });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
