/**
 * Google OAuth 2.0 helpers (RT-16.5).
 *
 * Pure REST against Google's token + userinfo endpoints. We deliberately
 * avoid pulling `google-auth-library` for the redirect flow because we only
 * need two HTTP calls and the dependency adds ~1.5 MB to the server bundle.
 * The One Tap flow (RT-16.6) verifies a JWT against Google's JWKS, which
 * `jose` (already a dep) handles natively.
 */

const GOOGLE_AUTHZ_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";

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
 * Derive the redirect URI from the incoming request URL. Must match a URI
 * registered in the GCP OAuth client exactly — we register
 *   https://renttools.io/api/auth/google/callback
 *   http://localhost:3000/api/auth/google/callback
 * so this returns whichever matches the current host.
 */
export function deriveRedirectUri(request: Request): string {
  const url = new URL(request.url);
  return `${url.origin}/api/auth/google/callback`;
}
