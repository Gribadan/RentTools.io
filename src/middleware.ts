import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { log } from "@/lib/logger";

const JWT_SECRET_RAW = process.env.JWT_SECRET || "fallback-secret-change-me";
const SECRET = new TextEncoder().encode(JWT_SECRET_RAW);
const IS_DEFAULT_SECRET = JWT_SECRET_RAW === "fallback-secret-change-me";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/terms",
  "/privacy",
  "/onboard",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/google", // covers /api/auth/google + /callback + /one-tap (startsWith match)
  "/api/onboard",
  "/api/calendar/feed",
  "/api/calendar/cron",
  "/api/health",
  "/api/site-config",
];

function clientIpFromRequest(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function logRequest(
  request: NextRequest,
  response: NextResponse,
  startedAt: number,
  userId?: number
) {
  log({
    msg: "http",
    method: request.method,
    path: request.nextUrl.pathname,
    status: response.status,
    durationMs: Date.now() - startedAt,
    userId: userId ?? null,
    ip: clientIpFromRequest(request),
  });
}

// Security headers applied to every response
function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // CSP: allow self + inline (Next.js needs unsafe-inline for hydration), no eval
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' data: fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startedAt = Date.now();

  // Refuse to authenticate against the default secret in production
  if (IS_DEFAULT_SECRET && process.env.NODE_ENV === "production" && !PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    const r = new NextResponse("JWT_SECRET not configured. Set the JWT_SECRET env var to a strong random string.", { status: 500 });
    logRequest(request, r as NextResponse, startedAt);
    return r;
  }

  // Allow public paths
  // Special-case "/" so it behaves as exact-match (PUBLIC_PATHS uses startsWith,
  // and "/" would match every path). The landing page itself redirects to
  // /dashboard for logged-in visitors via getSession().
  if (pathname === "/" || PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const r = withSecurityHeaders(NextResponse.next());
    logRequest(request, r, startedAt);
    return r;
  }

  // Allow static assets and Next.js internals (skip logging — too noisy)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Build a login redirect that preserves the requested path as ?next=
  const buildLoginRedirect = () => {
    const url = new URL("/login", request.url);
    const target = pathname + (request.nextUrl.search || "");
    if (target && target !== "/" && target !== "/login") {
      url.searchParams.set("next", target);
    }
    return NextResponse.redirect(url);
  };

  // Check session cookie
  const token = request.cookies.get("rent-tool-session")?.value;
  if (!token) {
    const r = pathname.startsWith("/api/")
      ? withSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
      : buildLoginRedirect();
    logRequest(request, r, startedAt);
    return r;
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const userId = typeof (payload as { userId?: unknown }).userId === "number"
      ? (payload as { userId: number }).userId
      : undefined;
    const role = typeof (payload as { role?: unknown }).role === "string"
      ? (payload as { role: string }).role
      : undefined;

    // Gate /api/admin/* at the boundary — only superadmins can reach any admin route.
    if (pathname.startsWith("/api/admin/") && role !== "superadmin") {
      const r = withSecurityHeaders(
        NextResponse.json({ error: "Forbidden" }, { status: 403 })
      );
      logRequest(request, r, startedAt, userId);
      return r;
    }

    const r = withSecurityHeaders(NextResponse.next());
    logRequest(request, r, startedAt, userId);
    return r;
  } catch {
    const r = pathname.startsWith("/api/")
      ? withSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
      : buildLoginRedirect();
    logRequest(request, r, startedAt);
    return r;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
