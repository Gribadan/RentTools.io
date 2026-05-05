import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canManageProperty } from "@/lib/ownership";

// RT-25.2 — find-or-create a GuestFormSubmission for this reservation
// against the property's first GuestFormTemplate. Returns the share
// token + relative public URL the host can copy and send to the guest.
// Idempotent: re-POSTing returns the same submission (and same token)
// rather than creating duplicates, so the UI can call this every time
// the host clicks "send pre-arrival form".

function mintShareToken(): string {
  // 24 random bytes → 32-char base64url. Long enough that brute force
  // is infeasible; short enough to fit in a paste/link without wrap.
  return randomBytes(24).toString("base64url");
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const reservation = await prisma.reservation.findUnique({
      where: { id: numId },
      select: { id: true, propertyId: true },
    });
    if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!(await canManageProperty(reservation.propertyId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const template = await prisma.guestFormTemplate.findFirst({
      where: { propertyId: reservation.propertyId },
      orderBy: { createdAt: "asc" },
    });
    if (!template) {
      return NextResponse.json(
        { error: "No guest-form template configured for this property" },
        { status: 400 }
      );
    }

    const existing = await prisma.guestFormSubmission.findFirst({
      where: { reservationId: numId, templateId: template.id },
      orderBy: { createdAt: "asc" },
    });

    const submission =
      existing ??
      (await prisma.guestFormSubmission.create({
        data: {
          reservationId: numId,
          templateId: template.id,
          shareToken: mintShareToken(),
        },
      }));

    return NextResponse.json({
      shareToken: submission.shareToken,
      shareUrl: `/g/${submission.shareToken}`,
      submittedAt: submission.submittedAt,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
