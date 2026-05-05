/**
 * Google OAuth 2.0 helpers (RT-16.5) + Google One Tap helpers (RT-16.6).
 *
 * Pure REST against Google's token + userinfo endpoints for the redirect
 * flow. We deliberately avoid pulling `google-auth-library` because we only
 * need a few HTTP calls and the dependency adds ~1.5 MB to the server bundle.
 * The One Tap flow verifies a JWT against Google's JWKS, which `jose`
 * (already a dep) handles natively.
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

const GOOGLE_AUTHZ_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
// Google may issue tokens with either issuer; both are valid per the spec.
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
}

export interface GoogleProfile {
  id: string; // Google subject (sub) — stable, never reused
  email: string;
  verified_email?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

export function getGoogleConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/**
 * Build the Google authorisation URL the user is redirected to. The state
 * is signed by the caller and round-tripped via a cookie + the `state`
 * query param to defeat CSRF.
 */
export function buildAuthorizationUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  /** Optional: hint the consent screen to pre-select an account. */
  loginHint?: string;
}): string {
  const url = new URL(GOOGLE_AUTHZ_ENDPOINT);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  if (params.loginHint) url.searchParams.set("login_hint", params.loginHint);
  return url.toString();
}

export async function exchangeCodeForTokens(args: {
  code: string;
  redirectUri: string;
  config: GoogleOAuthConfig;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code: args.code,
    client_id: args.config.clientId,
    client_secret: args.config.clientSecret,
    redirect_uri: args.redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google userinfo failed: ${res.status} ${text}`);
  }
  return (await res.json()) as GoogleProfile;
}

/**
 * Public origin of the incoming request, honoring proxy headers.
 *
 * Behind a reverse proxy (nginx → Next on localhost) `new URL(request.url)`
 * reflects the proxy hop's HTTP/localhost addressing, not the public-facing
 * URL Cloudflare presents to users. Honor X-Forwarded-Proto / X-Forwarded-Host
 * first, fall back to the request URL only when no proxy headers are present
 * (e.g. local dev).
 */
export function getPublicOrigin(request: Request): string {
  const url = new URL(request.url);
  const fwdProto = request.headers.get("x-forwarded-proto");
  const fwdHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  // Take the FIRST forwarded value if a comma-separated chain is sent
  // (Cloudflare → nginx → next can stack headers in some setups).
  const proto = (fwdProto?.split(",")[0]?.trim()) || url.protocol.replace(/:$/, "");
  const host = (fwdHost?.split(",")[0]?.trim()) || url.host;
  return `${proto}://${host}`;
}

/**
 * Derive the redirect URI for the Google OAuth flow. Must match a URI
 * registered in the GCP OAuth client exactly — we register
 *   https://renttools.io/api/auth/google/callback
 *   http://localhost:3000/api/auth/google/callback
 */
export function deriveRedirectUri(request: Request): string {
  return `${getPublicOrigin(request)}/api/auth/google/callback`;
}

/**
 * Lazy singleton JWKS — the resolver caches keys + handles rotation, so we
 * keep it module-scoped instead of recreating per request.
 */
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;
function getGoogleJWKS() {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
  }
  return jwksCache;
}

/**
 * Verify a Google One Tap credential (an OIDC ID token JWT) against Google's
 * JWKS. Returns a profile shaped like fetchGoogleProfile() so downstream
 * find-or-create logic doesn't have to special-case which path it came from.
 *
 * Throws on any verification failure: bad signature, wrong audience, wrong
 * issuer, expired token, missing required claim. Callers should treat any
 * throw as an authentication failure (401-equivalent).
 */
export async function verifyOneTapIdToken(
  credential: string,
  expectedClientId: string
): Promise<GoogleProfile> {
  const { payload } = await jwtVerify(credential, getGoogleJWKS(), {
    issuer: GOOGLE_ISSUERS,
    audience: expectedClientId,
  });

  const claims = payload as JWTPayload & {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  };

  if (!claims.sub || !claims.email) {
    throw new Error("Google One Tap token missing sub or email");
  }

  return {
    id: claims.sub,
    email: claims.email,
    verified_email: claims.email_verified,
    name: claims.name,
    given_name: claims.given_name,
    family_name: claims.family_name,
    picture: claims.picture,
  };
}

/**
 * Find an existing user by Google subject or matching email, otherwise
 * create a brand-new user with a sanitised username derived from the email
 * local part. Shared by the redirect callback and the One Tap endpoint so
 * both code paths produce identical user records.
 */
export async function findOrCreateUserForGoogle(profile: GoogleProfile) {
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
  return hashPassword(randomBytes(32).toString("base64url"));
}
