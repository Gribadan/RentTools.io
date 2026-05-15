import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { log } from "@/lib/logger";

const JWT_SECRET_RAW = process.env.JWT_SECRET || "fallback-secret-change-me";
const SECRET = new TextEncoder().encode(JWT_SECRET_RAW);
const IS_DEFAULT_SECRET = JWT_SECRET_RAW === "fallback-secret-change-me";

// ─────────────────────────── i18n routing ───────────────────────────
// Each non-default locale has its own URL prefix (`/ru/...`, `/de/...`,
// etc.). This is what makes the site Google-indexable per language —
// see .routines/I18N-SEO-AUDIT.md for the full rationale.
//
// To keep all the page files in their existing locations (no `[locale]`
// route refactor), the middleware does an internal rewrite: a hit to
// `/ru/blog/foo` is served by `app/blog/[slug]/page.tsx` after rewriting
// to `/blog/foo`. The locale travels via two request headers the page
// reads via `next/headers`:
//   - x-locale: the resolved locale ('en' for default-no-prefix, or the
//     prefix for everything else).
//   - x-pathname: the user-visible URL path (with the prefix), so
//     generateMetadata can build correct canonicals + hreflang
//     alternates without reconstructing it.
//
// Adding a new language:
//   1. Append its code to SUPPORTED_LOCALES below.
//   2. Add the COPY block in each marketing page.
//   3. Done — no new route files, no middleware changes.
const SUPPORTED_LOCALES = ["en", "ru", "de", "fr", "es"] as const;
const DEFAULT_LOCALE = "en";
const LOCALE_PREFIXES = SUPPORTED_LOCALES.filter((l) => l !== DEFAULT_LOCALE); // ['ru'] today

// Only public marketing surfaces are localised. Dashboard / admin /
// API / token-gated routes (g, invite) stay language-agnostic — the
// dashboard already runs through the client-side useI18n hook and
// doesn't need URL-distinct versions for SEO.
//
// /privacy and /terms are deliberately EN-only: legal copy needs
// professional review per locale, and serving the same English text
// from /ru/privacy as from /privacy is a duplicate-content signal to
// Google. Keeping them off the prefix list means /ru/privacy redirects
// to /privacy, which matches the user's intent (read the legal terms)
// without lying about translation status.
const LOCALIZABLE_PATHS = ["/", "/onboard", "/blog", "/login", "/signup"];

function detectLocaleFromPath(pathname: string): { locale: string; rest: string } | null {
  for (const loc of LOCALE_PREFIXES) {
    if (pathname === `/${loc}`) return { locale: loc, rest: "/" };
    if (pathname.startsWith(`/${loc}/`)) return { locale: loc, rest: pathname.slice(loc.length + 1) };
  }
  return null;
}

function isLocalizable(rest: string): boolean {
  // Each entry in LOCALIZABLE_PATHS matches either the exact path or
  // any sub-path under it. The "/" entry matches ONLY the exact home
  // path — not every path that starts with "/" (which is every path).
  // Without this guard, /ru/privacy would pass the "starts with /"
  // check and end up rewritten to /privacy with x-locale=ru, when it
  // should be 308-redirected to /privacy (privacy is EN-only).
  return LOCALIZABLE_PATHS.some((p) => {
    if (p === "/") return rest === "/";
    return rest === p || rest.startsWith(`${p}/`);
  });
}

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/terms",
  "/privacy",
  "/onboard",
  "/blog", // public blog index, post pages, tag pages, rss.xml
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/google", // covers /api/auth/google + /callback + /one-tap (startsWith match)
  "/api/onboard", // covers /api/onboard + /api/onboard/test-platform (startsWith)
  "/api/calendar/feed",
  "/api/calendar/cron",
  "/api/health",
  "/api/site-config",
  "/monitoring", // Sentry tunnel route (next.config.ts → withSentryConfig) — browser SDK POSTs here
  "/g", // RT-25.2: public guest-form fill-in page at /g/[token]
  "/api/g", // RT-25.2: public submit endpoint at /api/g/[token]/submit
  "/api/feedback", // site-wide feedback endpoint — accepts anonymous POSTs, rate-limited by IP-hash at the route layer
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
  // CSP — allow self + inline (Next.js needs unsafe-inline for hydration).
  // accounts.google.com is allowed in script-src and frame-src so Google
  // One Tap and the Continue-with-Google flow can load their script and
  // render the consent iframe.
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com https://accounts.google.com",
      "font-src 'self' data: fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https:",
      "frame-src 'self' https://accounts.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com",
    ].join("; ")
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startedAt = Date.now();

  // ── i18n routing ──
  // If the path begins with a known non-default locale prefix
  // (e.g. /ru, /de), strip it and rewrite internally. The page files
  // live at their default-locale paths; the locale travels via
  // request headers so getLocale() can read it server-side.
  //
  // /ru/<non-localizable> (e.g. /ru/dashboard) gets redirected to
  // /<non-localizable> — the dashboard isn't localised at the URL
  // level (it runs through useI18n + cookie). This way the URL bar
  // never shows a /ru/ prefix on a page that doesn't have a real
  // RU version.
  const localeMatch = detectLocaleFromPath(pathname);
  if (localeMatch) {
    if (!isLocalizable(localeMatch.rest)) {
      const url = request.nextUrl.clone();
      url.pathname = localeMatch.rest;
      const r = NextResponse.redirect(url);
      logRequest(request, r, startedAt);
      return r;
    }
    const url = request.nextUrl.clone();
    url.pathname = localeMatch.rest;
    const headers = new Headers(request.headers);
    headers.set("x-locale", localeMatch.locale);
    headers.set("x-pathname", pathname);
    const r = withSecurityHeaders(NextResponse.rewrite(url, { request: { headers } }));
    logRequest(request, r, startedAt);
    return r;
  }
  // For default-locale URLs (no /<locale>/ prefix), reconcile the URL
  // with the cookie. If the user's rt-locale cookie picks a non-default
  // locale and they hit a localizable default-locale URL, redirect to
  // the prefixed equivalent so URL ↔ body language always agree.
  //
  // Why this matters: without the redirect, an authenticated user with
  // rt-locale=ru clicking a hard-coded Link href="/blog" lands on /blog
  // and the cookie fallback below makes the server render Russian under
  // the English URL. URL bar says /blog, body is in Russian. The user's
  // refresh report: "URL doesn't change but I see the wrong language."
  // The redirect makes the URL match what the user expects.
  //
  // Crawl impact: Googlebot has no cookie, so cookieLocale is undefined,
  // resolvedLocale is DEFAULT_LOCALE, and the redirect is skipped — Google
  // continues to crawl /blog as the EN canonical it has always been.
  // Direct deep-link visits (someone pasting /blog in their browser) also
  // skip the redirect because their cookie is empty until they choose a
  // language. Only post-locale-switch navigations are redirected, and
  // only the first time per locale (after that, internal links are
  // already locale-prefixed by the locale-aware Link helper).
  const cookieLocale = request.cookies.get("rt-locale")?.value;
  const resolvedLocale = SUPPORTED_LOCALES.includes(cookieLocale as typeof SUPPORTED_LOCALES[number])
    ? (cookieLocale as string)
    : DEFAULT_LOCALE;
  if (
    resolvedLocale !== DEFAULT_LOCALE &&
    isLocalizable(pathname) &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next") &&
    !pathname.includes(".")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${resolvedLocale}` : `/${resolvedLocale}${pathname}`;
    const r = NextResponse.redirect(url);
    logRequest(request, r, startedAt);
    return r;
  }
  const i18nHeaders = new Headers(request.headers);
  i18nHeaders.set("x-locale", resolvedLocale);
  i18nHeaders.set("x-pathname", pathname);

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
    const r = withSecurityHeaders(
      NextResponse.next({ request: { headers: i18nHeaders } }),
    );
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
    const impersonatorId = typeof (payload as { impersonatorId?: unknown }).impersonatorId === "number"
      ? (payload as { impersonatorId: number }).impersonatorId
      : undefined;

    // Gate /api/admin/* at the boundary — only superadmins can reach
    // any admin route, with ONE exception: the exit-impersonation
    // endpoint. When the current session is an impersonation, the JWT
    // identifies as the target user (role="user") so a naive
    // role !== "superadmin" check would lock the admin OUT of their
    // own exit path. Allow it when impersonatorId is set — that field
    // only appears on tokens minted by the impersonate endpoint, which
    // already validated superadmin at issue time.
    if (pathname.startsWith("/api/admin/") && role !== "superadmin") {
      const isExitImpersonation =
        pathname === "/api/admin/exit-impersonation" && impersonatorId !== undefined;
      if (!isExitImpersonation) {
        const r = withSecurityHeaders(
          NextResponse.json({ error: "Forbidden" }, { status: 403 })
        );
        logRequest(request, r, startedAt, userId);
        return r;
      }
    }

    const r = withSecurityHeaders(NextResponse.next({ request: { headers: i18nHeaders } }));
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
