import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// POST /api/property-manager-invites/accept
// Body: { token }
// Auth required. Idempotent: accepting your own already-used invite returns the same property.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const token = String(body.token || "").trim();
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const invite = await prisma.propertyManagerInvite.findUnique({
      where: { token },
      include: {
        property: { select: { id: true, name: true, userId: true } },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    if (invite.revokedAt) {
      return NextResponse.json({ error: "Invite has been revoked" }, { status: 410 });
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
    }

    // Owner can't accept their own invite
    if (invite.property.userId === session.userId) {
      return NextResponse.json(
        { error: "You already own this property" },
        { status: 400 }
      );
    }

    // Already accepted by this user → idempotent success
    if (invite.acceptedById === session.userId) {
      return NextResponse.json({
        action: "already_accepted",
        propertyId: invite.propertyId,
        propertyName: invite.property.name,
      });
    }

    // Already accepted by someone else
    if (invite.acceptedById && invite.acceptedById !== session.userId) {
      return NextResponse.json(
        { error: "Invite has already been used by another user" },
        { status: 410 }
      );
    }

    // Already a manager (e.g. added by username earlier) → mark invite accepted, return success
    const existing = await prisma.propertyManager.findUnique({
      where: {
        managerId_propertyId: {
          managerId: session.userId,
          propertyId: invite.propertyId,
        },
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.propertyManager.create({
        data: {
          propertyId: invite.propertyId,
          managerId: session.userId,
          grantedById: invite.createdById,
        },
      });
    }

    await prisma.propertyManagerInvite.update({
      where: { id: invite.id },
      data: { acceptedById: session.userId, acceptedAt: new Date() },
    });

    await logAudit(session.userId, "create", "manager", invite.id, {
      action: "invite_accepted",
      propertyId: invite.propertyId,
    });

    return NextResponse.json({
      action: "accepted",
      propertyId: invite.propertyId,
      propertyName: invite.property.name,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/property-manager-invites/accept?token=X — preview an invite (auth required)
// Returns property name + owner so the user knows what they're accepting
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const invite = await prisma.propertyManagerInvite.findUnique({
      where: { token },
      include: {
        property: { select: { id: true, name: true } },
        createdBy: { select: { username: true } },
      },
    });

    if (!invite) {
      return NextResponse.json({ status: "not_found" });
    }
    if (invite.revokedAt) {
      return NextResponse.json({ status: "revoked" });
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ status: "expired" });
    }
    if (invite.acceptedById && invite.acceptedById !== session.userId) {
      return NextResponse.json({ status: "used" });
    }

    return NextResponse.json({
      status: invite.acceptedById === session.userId ? "already_accepted" : "valid",
      propertyId: invite.propertyId,
      propertyName: invite.property.name,
      invitedBy: invite.createdBy.username,
      expiresAt: invite.expiresAt,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
