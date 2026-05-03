import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  // Prevent deleting yourself
  if (userId === session.userId) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}
