import type { Locale } from "@/lib/i18n/translations";

// Single source of truth for what locales the public site serves.
// Mirrors the SUPPORTED_LOCALES constant in src/middleware.ts — keep
// them in sync when adding a language. (Inline duplication is
// deliberate: middleware runs in Edge runtime and importing from
// arbitrary modules is fragile; one extra const to update per new
// language is cheap.)
export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "ru"];
export const DEFAULT_LOCALE: Locale = "en";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://renttools.io";

/**
 * Build the per-locale URL map for a given default-locale path.
 *
 * Used by `generateMetadata` to fill `alternates.languages` (which
 * Next.js renders as `<link rel="alternate" hreflang="…">` tags) and
 * `alternates.canonical` (self-canonical per language version).
 *
 * Input is the default-locale path (no prefix). For `/`, the RU URL
 * is `/ru` (no trailing slash). For `/blog/foo`, the RU URL is
 * `/ru/blog/foo`. The `x-default` entry points to the default-locale
 * URL — what Google should show when the user's preference is unknown.
 *
 * Example: localizedAlternates("/blog/foo", "ru") returns:
 *   {
 *     canonical: "/ru/blog/foo",
 *     languages: {
 *       en: "/blog/foo",
 *       ru: "/ru/blog/foo",
 *       "x-default": "/blog/foo",
 *     }
 *   }
 */
export function localizedAlternates(
  defaultPath: string,
  currentLocale: Locale,
): { canonical: string; languages: Record<string, string> } {
  const buildPath = (loc: Locale): string => {
    if (loc === DEFAULT_LOCALE) return defaultPath;
    return defaultPath === "/" ? `/${loc}` : `/${loc}${defaultPath}`;
  };
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    languages[loc] = buildPath(loc);
  }
  languages["x-default"] = defaultPath;
  return {
    canonical: buildPath(currentLocale),
    languages,
  };
}

/**
 * Sometimes you have the user-visible path (e.g. `/ru/blog/foo`) and
 * need to derive the corresponding default-locale path. Used by
 * generateMetadata callers that want to build alternates from
 * `getCanonicalPath()` rather than hard-coding the default path.
 */
export function stripLocalePrefix(visiblePath: string): {
  defaultPath: string;
  locale: Locale;
} {
  for (const loc of SUPPORTED_LOCALES) {
    if (loc === DEFAULT_LOCALE) continue;
    if (visiblePath === `/${loc}`) return { defaultPath: "/", locale: loc };
    if (visiblePath.startsWith(`/${loc}/`)) {
      return { defaultPath: visiblePath.slice(loc.length + 1), locale: loc };
    }
  }
  return { defaultPath: visiblePath, locale: DEFAULT_LOCALE };
}

export { SITE_URL };
