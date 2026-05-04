import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";

// POST /api/admin/users/:id/suspend → marks user.suspendedAt = now
// DELETE /api/admin/users/:id/suspend → clears user.suspendedAt
// Suspended users cannot log in (login route refuses) and existing
// sessions are cleared on the next request via getSession() (RT-15.11).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const userId = Number(id);
    if (!Number.isFinite(userId) || !Number.isInteger(userId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    if (userId === auth.session.userId) {
      return NextResponse.json(
        { error: "Cannot suspend your own account" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (target.role === "superadmin") {
      return NextResponse.json(
        { error: "Cannot suspend a superadmin" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { suspendedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const userId = Number(id);
    if (!Number.isFinite(userId) || !Number.isInteger(userId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { suspendedAt: null },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
