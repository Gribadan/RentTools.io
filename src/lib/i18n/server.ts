import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/cookie";
import type { Locale } from "@/lib/i18n/translations";

/**
 * Read the current visitor's locale on the server. Mirrors what the
 * client `useI18n()` hook resolves to, but works inside server
 * components, layouts, and `generateMetadata()` where hooks aren't
 * available.
 *
 * Defaults to "en" when no rt-locale cookie is set. Falls back to "en"
 * for any unknown value so a stale cookie can't crash a render.
 *
 * Used by:
 *   - src/app/page.tsx (home)
 *   - src/app/onboard/page.tsx layout (where the wizard is server-shell)
 *   - src/components/marketing-header.tsx (nav labels)
 *   - any other server-rendered marketing surface
 *
 * Pattern at the call site:
 *   const locale = await getLocale();
 *   const t = locale === "ru" ? RU : EN;
 *   <h1>{t.heroTitle}</h1>
 *
 * That gives readable code per-page without bringing the client-side
 * useI18n() context into server components (which would force them
 * client-side and lose the SSR/SEO benefits).
 */
export async function getLocale(): Promise<Locale> {
  // Middleware (src/middleware.ts) sets `x-locale` to the resolved
  // locale based on URL prefix → cookie → default. Reading from the
  // header keeps marketing pages aligned with what the URL actually
  // says (a cookie picking RU on a / URL is a shadow of the old
  // single-URL world; URL is now authoritative). Header is missing
  // for static-render bypass / direct page rendering during build —
  // fall through to cookie + default in that case.
  try {
    const h = await headers();
    const fromHeader = h.get("x-locale");
    if (fromHeader === "ru") return "ru";
    if (fromHeader === "en") return "en";
  } catch {
    // headers() throws when called outside a request scope (e.g. during
    // static asset generation). Fall through to cookie.
  }
  try {
    const store = await cookies();
    const value = store.get(LOCALE_COOKIE_NAME)?.value;
    return value === "ru" ? "ru" : "en";
  } catch {
    return "en";
  }
}

/**
 * Read the user-visible URL path the request hit, with locale prefix
 * still attached. Set by middleware via `x-pathname`. Used by
 * `generateMetadata` to build correct canonical + hreflang URLs that
 * match what the address bar shows, not the rewritten internal path.
 *
 * Returns null when the header isn't set (during static generation).
 */
export async function getCanonicalPath(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-pathname");
  } catch {
    return null;
  }
}
