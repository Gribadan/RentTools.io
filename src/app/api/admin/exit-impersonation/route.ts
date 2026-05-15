import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  getSession,
  readImpersonatorCookie,
  setSessionCookie,
  clearImpersonatorCookie,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me",
);

/**
 * Exit an impersonation session. Restores the admin's original JWT
 * from the side cookie onto the main session cookie, then clears the
 * side cookie. Called by the banner's "Exit" button.
 *
 * Auth model: anyone holding a valid impersonation session
 * (impersonatorId set on the JWT) can call this. We don't require
 * superadmin here because the impersonator-cookie restore IS the
 * privilege check — only the admin who originally parked their token
 * can possibly have that cookie, and only if their browser holds the
 * original session that the cookie was set against.
 */
export async function POST() {
  const session = await getSession();
  if (!session?.impersonatorId) {
    return NextResponse.json(
      { error: "Not in an impersonation session" },
      { status: 400 },
    );
  }

  const adminToken = await readImpersonatorCookie();
  if (!adminToken) {
    // The side cookie expired / was cleared before the impersonation
    // session did. Fail safely — clear the impersonation cookie so the
    // user gets redirected to /login on the next request rather than
    // staying stuck in the target user's view forever.
    await clearImpersonatorCookie();
    return NextResponse.json(
      { error: "Original session lost — please log in again" },
      { status: 410 },
    );
  }

  // Verify the parked token is still cryptographically valid. If the
  // admin's original session expired in the background (>7 days since
  // sign-in, JWT.exp passed), we can't restore it — same fallback as
  // above.
  let adminPayload: { userId: number; username: string; role: string };
  try {
    const { payload } = await jwtVerify(adminToken, SECRET);
    adminPayload = payload as { userId: number; username: string; role: string };
  } catch {
    await clearImpersonatorCookie();
    return NextResponse.json(
      { error: "Original session expired — please log in again" },
      { status: 410 },
    );
  }

  // Restore the admin's original session JWT (not a fresh one — that
  // would reset their sliding 7-day expiry).
  await setSessionCookie(adminToken, 60 * 60 * 24 * 7);
  await clearImpersonatorCookie();

  await logAudit(adminPayload.userId, "exit-impersonate", "user", session.userId, {
    impersonator: adminPayload.username,
    target: session.username,
  });

  return NextResponse.json({ ok: true });
}
