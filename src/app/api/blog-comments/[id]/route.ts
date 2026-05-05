import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type Params = Promise<{ id: string }>;

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const { session, response } = await requireSuperadmin();
    if (!session) return response;

    const { id } = await params;
    const commentId = Number(id);
    if (!Number.isInteger(commentId) || commentId <= 0) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const json = await request.json().catch(() => null);
    const status = json?.status;
    if (status !== "visible" && status !== "hidden") {
      return NextResponse.json({ error: "status must be 'visible' or 'hidden'" }, { status: 400 });
    }

    const existing = await prisma.blogComment.findUnique({ where: { id: commentId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.blogComment.update({
      where: { id: commentId },
      data: { status, updatedAt: new Date() },
    });
    await logAudit(session.userId, "update", "blogComment", commentId, {
      previousStatus: existing.status,
      status,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { session, response } = await requireSuperadmin();
    if (!session) return response;

    const { id } = await params;
    const commentId = Number(id);
    if (!Number.isInteger(commentId) || commentId <= 0) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const existing = await prisma.blogComment.findUnique({ where: { id: commentId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.blogComment.update({
      where: { id: commentId },
      data: { status: "deleted", updatedAt: new Date() },
    });
    await logAudit(session.userId, "delete", "blogComment", commentId, {
      previousStatus: existing.status,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
