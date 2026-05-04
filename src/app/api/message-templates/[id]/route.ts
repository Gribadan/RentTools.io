import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canManageProperty } from "@/lib/ownership";

export const dynamic = "force-dynamic";

async function loadManageableTemplate(id: number, userId: number, role: string) {
  const t = await prisma.messageTemplate.findUnique({
    where: { id },
    select: { id: true, propertyId: true },
  });
  if (!t) return null;
  if (!(await canManageProperty(t.propertyId, userId, role))) return null;
  return t;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const owned = await loadManageableTemplate(numId, session.userId, session.role);
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.language === "string") data.language = body.language;
    if (typeof body.subject === "string") data.subject = body.subject;
    if (typeof body.body === "string") data.body = body.body;
    if (Number.isInteger(body.sendOffsetDays)) data.sendOffsetDays = body.sendOffsetDays;
    data.updatedAt = new Date();

    const updated = await prisma.messageTemplate.update({
      where: { id: numId },
      data,
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const owned = await loadManageableTemplate(numId, session.userId, session.role);
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.messageTemplate.delete({ where: { id: numId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
