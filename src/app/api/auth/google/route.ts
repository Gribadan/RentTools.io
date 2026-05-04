import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { buildAuthorizationUrl, deriveRedirectUri, getGoogleConfig } from "@/lib/google-oauth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const STATE_COOKIE = "rt-google-oauth-state";
const NEXT_COOKIE = "rt-google-oauth-next";

/**
 * Kick off the Google OAuth dance. Generates a random `state` value, stores
 * it in an httpOnly cookie, and redirects to Google with the same value in
 * the query string. The callback verifies the two match.
 *
 * Optional ?next=/somewhere is also persisted to a cookie so we can land
 * the user back where they started after sign-in.
 */
export async function GET(request: NextRequest) {
  const config = getGoogleConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Google sign-in is not configured on this server" },
      { status: 503 }
    );
  }

  // Light per-IP throttle: an OAuth start has no body and is cheap, but
  // we don't want a single IP firing endless redirects either.
  const rl = checkRateLimit(`oauth-start:${clientIp(request)}`, 30, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many sign-in attempts. Try again in ${rl.resetSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rl.resetSeconds) } }
    );
  }

  const state = crypto.randomBytes(24).toString("base64url");
  const redirectUri = deriveRedirectUri(request);

  const nextRaw = request.nextUrl.searchParams.get("next") || "";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "";

  const authzUrl = buildAuthorizationUrl({
    clientId: config.clientId,
    redirectUri,
    state,
  });

  const res = NextResponse.redirect(authzUrl);
  // 10 min lifetime is more than enough for a user to click through Google's
  // consent screen; longer cookies just expand the CSRF window.
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  if (next) {
    res.cookies.set(NEXT_COOKIE, next, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
  }
  return res;
}
