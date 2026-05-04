import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import {
  deriveRedirectUri,
  exchangeCodeForTokens,
  fetchGoogleProfile,
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

async function findOrCreateUserForGoogle(profile: GoogleProfile) {
  // 1. Match by stable Google subject.
  const byGoogle = await prisma.user.findUnique({ where: { googleId: profile.id } });
  if (byGoogle) return byGoogle;

  // 2. Match by email — links a username/password account that already
  // had this email set (e.g. via a future profile field). Existing
  // username-only accounts have no email so they won't collide.
  const email = profile.email.toLowerCase();
  const byEmail = await prisma.user.findFirst({ where: { email } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { googleId: profile.id, email },
    });
  }

  // 3. New user. Generate a unique username from the email's local part
  // (or a random fallback) and try suffixes until we find one free.
  const username = await generateUniqueUsername(profile);

  return prisma.user.create({
    data: {
      username,
      // Random unguessable placeholder — Google sign-in users can later
      // set a password via the existing change-password flow if they
      // want a non-Google sign-in path too.
      password: await randomPasswordPlaceholder(),
      role: "user",
      email,
      googleId: profile.id,
    },
  });
}

async function generateUniqueUsername(profile: GoogleProfile): Promise<string> {
  const base = sanitizeUsernameBase(
    profile.email.split("@")[0] || profile.given_name || profile.name || "user"
  );

  // Try the bare base first, then base2, base3, … up to 50 attempts.
  // 50 collisions is implausible for a sub-100k user base; if it ever
  // happens we fall through to a random suffix.
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}${i + 1}`;
    const taken = await prisma.user.findUnique({ where: { username: candidate } });
    if (!taken) return candidate;
  }
  const { randomBytes } = await import("node:crypto");
  return `${base}-${randomBytes(3).toString("hex")}`;
}

function sanitizeUsernameBase(raw: string): string {
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  // Username has a min length of 3 in the signup route; make sure
  // Google-derived usernames clear the same bar.
  if (cleaned.length >= 3) return cleaned.slice(0, 24);
  return `user${cleaned}`.padEnd(4, "0").slice(0, 24);
}

async function randomPasswordPlaceholder(): Promise<string> {
  const { randomBytes } = await import("node:crypto");
  const { hashPassword } = await import("@/lib/auth");
  return hashPassword(randomBytes(32).toString("base64url"));
}
