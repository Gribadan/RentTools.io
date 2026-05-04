import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isPropertyOwner } from "@/lib/ownership";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const INVITE_TTL_DAYS = 7;

function generateToken(): string {
  // URL-safe random token, ~30 chars
  return randomBytes(24).toString("base64url");
}

// GET /api/property-manager-invites?propertyId=X — list pending invites (owner only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyIdRaw = request.nextUrl.searchParams.get("propertyId");
    const propertyId = parseInt(propertyIdRaw || "");
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: "Invalid propertyId" }, { status: 400 });
    }

    if (!(await isPropertyOwner(propertyId, session.userId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const invites = await prisma.propertyManagerInvite.findMany({
      where: {
        propertyId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invites);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/property-manager-invites — generate a new invite token (owner only)
// Body: { propertyId }
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const propertyId = parseInt(String(body.propertyId));
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: "Invalid propertyId" }, { status: 400 });
    }

    if (!(await isPropertyOwner(propertyId, session.userId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const invite = await prisma.propertyManagerInvite.create({
      data: {
        propertyId,
        token,
        createdById: session.userId,
        expiresAt,
      },
    });

    await logAudit(session.userId, "create", "manager", invite.id, {
      action: "invite_created",
      propertyId,
    });

    return NextResponse.json({
      id: invite.id,
      token: invite.token,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/property-manager-invites?id=X — revoke a pending invite (owner only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const idRaw = request.nextUrl.searchParams.get("id");
    const inviteId = parseInt(idRaw || "");
    if (isNaN(inviteId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const invite = await prisma.propertyManagerInvite.findUnique({
      where: { id: inviteId },
      select: { propertyId: true, acceptedAt: true },
    });
    if (!invite) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!(await isPropertyOwner(invite.propertyId, session.userId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (invite.acceptedAt) {
      return NextResponse.json(
        { error: "Already accepted" },
        { status: 400 }
      );
    }

    await prisma.propertyManagerInvite.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() },
    });

    await logAudit(session.userId, "delete", "manager", inviteId, {
      action: "invite_revoked",
      propertyId: invite.propertyId,
    });

    return NextResponse.json({ action: "revoked" });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
