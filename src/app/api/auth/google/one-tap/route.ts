import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import {
  findOrCreateUserForGoogle,
  getGoogleConfig,
  verifyOneTapIdToken,
} from "@/lib/google-oauth";
import { claimOnboardingDraft } from "@/lib/onboarding";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Google One Tap callback (RT-16.6).
 *
 * The browser receives a credential JWT from Google Identity Services and
 * POSTs it here. We verify against Google's JWKS (with the GCP client ID
 * baked in as the audience), then run the same find-or-create-user logic
 * the redirect callback uses.
 */
export async function POST(request: NextRequest) {
  const config = getGoogleConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Google sign-in is not configured on this server" },
      { status: 503 }
    );
  }

  const rl = checkRateLimit(`oauth-onetap:${clientIp(request)}`, 30, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many sign-in attempts. Try again in ${rl.resetSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rl.resetSeconds) } }
    );
  }

  let body: { credential?: unknown; next?: unknown };
  try {
    body = (await request.json()) as { credential?: unknown; next?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.credential !== "string" || body.credential.length === 0) {
    return NextResponse.json({ error: "Missing credential" }, { status: 400 });
  }

  let profile;
  try {
    profile = await verifyOneTapIdToken(body.credential, config.clientId);
  } catch (err) {
    console.error("Google One Tap verification failed:", err);
    return NextResponse.json({ error: "google_token_invalid" }, { status: 401 });
  }

  if (profile.verified_email === false) {
    return NextResponse.json({ error: "google_email_unverified" }, { status: 401 });
  }

  const user = await findOrCreateUserForGoogle(profile);
  if (user.suspendedAt) {
    return NextResponse.json({ error: "account_suspended" }, { status: 403 });
  }

  await createSession(user.id, user.username, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await claimOnboardingDraft(user.id);

  const nextRaw = typeof body.next === "string" ? body.next : "";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";

  return NextResponse.json({ ok: true, redirect: next });
}
