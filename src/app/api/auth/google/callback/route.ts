import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import {
  deriveRedirectUri,
  exchangeCodeForTokens,
  fetchGoogleProfile,
  findOrCreateUserForGoogle,
  getGoogleConfig,
  type GoogleProfile,
} from "@/lib/google-oauth";
import { claimOnboardingDraft } from "@/lib/onboarding";

const STATE_COOKIE = "rt-google-oauth-state";
const NEXT_COOKIE = "rt-google-oauth-next";

function loginErrorRedirect(request: NextRequest, code: string): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", code);
  const res = NextResponse.redirect(url);
  res.cookies.delete(STATE_COOKIE);
  res.cookies.delete(NEXT_COOKIE);
  return res;
}

export async function GET(request: NextRequest) {
  const config = getGoogleConfig();
  if (!config) return loginErrorRedirect(request, "google_unconfigured");

  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    // User cancelled or Google returned an error. Don't surface "access_denied"
    // as a scary error — it's a normal "I changed my mind" click.
    return loginErrorRedirect(request, errorParam);
  }
  if (!code || !state) return loginErrorRedirect(request, "google_missing_params");

  const cookieState = request.cookies.get(STATE_COOKIE)?.value;
  if (!cookieState || cookieState !== state) {
    return loginErrorRedirect(request, "google_state_mismatch");
  }

  const redirectUri = deriveRedirectUri(request);

  let profile: GoogleProfile;
  try {
    const tokens = await exchangeCodeForTokens({ code, redirectUri, config });
    profile = await fetchGoogleProfile(tokens.access_token);
  } catch (err) {
    console.error("Google OAuth exchange failed:", err);
    return loginErrorRedirect(request, "google_exchange_failed");
  }

  if (!profile.id || !profile.email) {
    return loginErrorRedirect(request, "google_profile_incomplete");
  }
  if (profile.verified_email === false) {
    // Refuse unverified emails — would let an attacker hijack a username
    // by claiming an unverified address that happens to match.
    return loginErrorRedirect(request, "google_email_unverified");
  }

  const user = await findOrCreateUserForGoogle(profile);
  if (user.suspendedAt) {
    return loginErrorRedirect(request, "account_suspended");
  }

  await createSession(user.id, user.username, user.role);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await claimOnboardingDraft(user.id);

  const nextCookie = request.cookies.get(NEXT_COOKIE)?.value;
  const next = nextCookie && nextCookie.startsWith("/") && !nextCookie.startsWith("//") ? nextCookie : "/dashboard";

  const res = NextResponse.redirect(new URL(next, request.url));
  res.cookies.delete(STATE_COOKIE);
  res.cookies.delete(NEXT_COOKIE);
  return res;
}
