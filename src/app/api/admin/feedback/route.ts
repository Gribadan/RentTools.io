import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";

const VALID_STATUS = new Set(["new", "read", "archived"]);
const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const status = statusFilter && VALID_STATUS.has(statusFilter) ? statusFilter : undefined;

  const where = status ? { status } : {};

  const [rows, counts] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, username: true } },
      },
    }),
    // Status histogram so the UI can render filter chips with counts.
    // Cheap aggregate query — at expected volume (<10k rows) this is
    // a single index sweep on Feedback_status_createdAt_idx.
    prisma.feedback.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      body: r.body,
      contactEmail: r.contactEmail,
      pagePath: r.pagePath,
      userAgent: r.userAgent,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt?.toISOString() ?? null,
      user: r.user,
      // ipHash deliberately omitted — admin doesn't need it on the
      // wire and we don't want it in the browser cache.
    })),
    counts: {
      new: counts.find((c) => c.status === "new")?._count._all ?? 0,
      read: counts.find((c) => c.status === "read")?._count._all ?? 0,
      archived: counts.find((c) => c.status === "archived")?._count._all ?? 0,
    },
  });
}
