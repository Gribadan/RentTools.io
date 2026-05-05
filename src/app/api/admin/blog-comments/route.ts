import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";

const SNIPPET_MAX = 240;

export async function GET(request: NextRequest) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const where = statusParam && statusParam !== "all" ? { status: statusParam } : undefined;

    const rows = await prisma.blogComment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        user: { select: { username: true } },
        post: { select: { id: true, slug: true, locale: true, title: true } },
      },
    });

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        body: r.body.length > SNIPPET_MAX ? `${r.body.slice(0, SNIPPET_MAX)}…` : r.body,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt?.toISOString() ?? null,
        user: r.user ? { id: r.userId, username: r.user.username } : { id: r.userId, username: null },
        post: r.post,
      })),
    );
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
