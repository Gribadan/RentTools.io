import { cookies } from "next/headers";
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
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE_NAME)?.value;
  return value === "ru" ? "ru" : "en";
}
