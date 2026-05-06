import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";

const VALID_STATUS = new Set(["new", "read", "archived"]);

function parseId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

// PATCH /api/admin/feedback/[id] — change status only. The body itself
// is immutable (we don't want admins editing visitor messages even by
// accident; the queue is an audit trail).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { status?: unknown };
  if (typeof body.status !== "string" || !VALID_STATUS.has(body.status)) {
    return NextResponse.json(
      { error: "status must be 'new', 'read', or 'archived'" },
      { status: 400 },
    );
  }

  const existing = await prisma.feedback.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.feedback.update({
    where: { id },
    data: { status: body.status, updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true, status: updated.status });
}

// DELETE — hard delete. Used for the rare case where a submission has
// PII the visitor wants removed (right-to-be-forgotten on the public
// feedback queue; the per-user delete-account flow handles the
// userId-attached case automatically via ON DELETE SET NULL).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const existing = await prisma.feedback.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.feedback.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
