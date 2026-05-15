import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireSuperadmin,
  createImpersonationSession,
  setSessionCookie,
  setImpersonatorCookie,
  readCurrentSessionToken,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/**
 * Start a superadmin → user impersonation. The admin's existing
 * session JWT is parked in a side cookie, the main session cookie
 * is replaced with a short-lived impersonation token that identifies
 * AS the target user but carries the admin's id+username so the
 * banner + audit log know who's actually driving.
 *
 * Guardrails:
 *   - Only superadmin can call this (requireSuperadmin).
 *   - Cannot impersonate another superadmin (lateral privilege
 *     escalation guard — superadmins should never need each other's
 *     view, and silently entering another admin's account is the kind
 *     of thing that ends in a compliance audit nightmare).
 *   - Cannot impersonate a suspended user (their data is read-only at
 *     the auth layer anyway, but exposing the view leaks state).
 *   - Cannot impersonate yourself (no-op + breaks the side-cookie
 *     restore path).
 *   - The impersonation token's expiry is 30 min — if the admin walks
 *     away from the keyboard the session decays before anyone can pick
 *     up the laptop and exfiltrate user data.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireSuperadmin();
  if (response) return response;

  const { id } = await params;
  const targetId = Number(id);
  if (!Number.isFinite(targetId)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  if (targetId === session.userId) {
    return NextResponse.json(
      { error: "Cannot impersonate yourself" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, username: true, role: true, suspendedAt: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.role === "superadmin") {
    return NextResponse.json(
      { error: "Cannot impersonate another superadmin" },
      { status: 403 },
    );
  }
  if (target.suspendedAt) {
    return NextResponse.json(
      { error: "Cannot impersonate a suspended user" },
      { status: 403 },
    );
  }

  // Park the admin's current session JWT in the impersonator side
  // cookie BEFORE we overwrite the main cookie — the exit endpoint
  // restores from this. If we minted a fresh admin token instead, the
  // restored session would have a brand-new exp time and the admin's
  // original 7-day sliding window would be lost; restoring the same
  // JWT preserves it.
  const adminToken = await readCurrentSessionToken();
  if (!adminToken) {
    return NextResponse.json(
      { error: "No active session to park" },
      { status: 500 },
    );
  }
  await setImpersonatorCookie(adminToken);

  const impersonationToken = await createImpersonationSession(
    target.id,
    target.username,
    target.role,
    session.userId,
    session.username,
  );
  await setSessionCookie(impersonationToken, 60 * 30);

  await logAudit(session.userId, "impersonate", "user", target.id, {
    impersonator: session.username,
    target: target.username,
  });

  return NextResponse.json({
    ok: true,
    targetUsername: target.username,
  });
}
