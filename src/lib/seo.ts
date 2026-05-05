/**
 * Per-page SEO override registry (RT-18.3 tick 1). Super-admin can set
 * title / description / OG image / canonical per (path, locale) via the
 * admin panel; getSeoForPath() merges the override with site-wide
 * defaults stored in SiteSetting and returns the final values for
 * `generateMetadata()` to consume.
 *
 * Reads are cached in-process for 60 seconds — same TTL as the platform
 * registry — so route handlers don't hit the DB on every request. The
 * admin write endpoints call invalidateSeoCache() to flush; multi-instance
 * deploys see eventual consistency within 60s.
 */
export interface SeoData {
  title: string | null;
  description: string | null;
  ogImage: string | null;
  canonical: string | null;
}

export type SeoLocale = "en" | "ru";

const CACHE_TTL_MS = 60_000;

interface CacheState {
  expiresAt: number;
  // Keyed as `${locale}::${path}`. A miss means no override exists.
  byKey: Map<string, SeoData>;
  // Site-wide defaults from SiteSetting. Populated even when the
  // overrides map is empty so a single getSeoForPath() call resolves
  // both layers from the same cache window.
  defaults: SeoData;
}

let cache: CacheState | null = null;

function makeKey(path: string, locale: SeoLocale): string {
  return `${locale}::${path}`;
}

// Path normalisation rules (kept conservative so admin entries match
// what a route handler will pass in):
//   - leading slash required
//   - querystring + fragment dropped
//   - trailing slash dropped EXCEPT for the root "/"
//   - empty input → "/"
//   - capped at 256 chars to prevent unbounded keys
export function normalizeSeoPath(input: string): string {
  if (typeof input !== "string") return "/";
  let p = input.trim();
  if (p.length === 0) return "/";
  // Strip query / hash
  const q = p.indexOf("?");
  if (q !== -1) p = p.slice(0, q);
  const h = p.indexOf("#");
  if (h !== -1) p = p.slice(0, h);
  if (!p.startsWith("/")) p = `/${p}`;
  // Collapse repeated slashes (//foo/bar → /foo/bar) but preserve "/"
  p = p.replace(/\/{2,}/g, "/");
  // Drop trailing slash except for root
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p.slice(0, 256);
}

/** True iff the locale is one of the supported codes. */
export function isValidSeoLocale(locale: string): locale is SeoLocale {
  return locale === "en" || locale === "ru";
}

async function loadCache(): Promise<CacheState> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache;

  const byKey = new Map<string, SeoData>();
  let defaults: SeoData = {
    title: null,
    description: null,
    ogImage: null,
    canonical: null,
  };

  try {
    const { prisma } = await import("@/lib/prisma");

    const [overrides, settings] = await Promise.all([
      prisma.seoOverride.findMany({
        select: {
          path: true,
          locale: true,
          title: true,
          description: true,
          ogImage: true,
          canonical: true,
        },
      }),
      prisma.siteSetting.findMany({
        where: {
          key: {
            in: ["seo_default_title", "seo_default_description", "seo_default_og_image"],
          },
        },
        select: { key: true, value: true },
      }),
    ]);

    for (const o of overrides) {
      const locale: SeoLocale = isValidSeoLocale(o.locale) ? o.locale : "en";
      byKey.set(makeKey(o.path, locale), {
        title: o.title ?? null,
        description: o.description ?? null,
        ogImage: o.ogImage ?? null,
        canonical: o.canonical ?? null,
      });
    }

    const settingsMap = new Map(settings.map((r) => [r.key, r.value]));
    defaults = {
      title: nonEmpty(settingsMap.get("seo_default_title")),
      description: nonEmpty(settingsMap.get("seo_default_description")),
      ogImage: nonEmpty(settingsMap.get("seo_default_og_image")),
      canonical: null,
    };
  } catch {
    // DB unavailable — return an empty state so callers fall back to
    // their own hardcoded defaults. Don't cache failures.
    return {
      expiresAt: now,
      byKey: new Map(),
      defaults: { title: null, description: null, ogImage: null, canonical: null },
    };
  }

  cache = { expiresAt: now + CACHE_TTL_MS, byKey, defaults };
  return cache;
}

function nonEmpty(s: string | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length > 0 ? t : null;
}

/**
 * Resolve SEO data for a path. Merge order (last writer wins):
 *   1. SiteSetting site-wide defaults (seo_default_title, etc.)
 *   2. Path-and-locale-specific override row
 *
 * A field is null in the result iff neither layer set it; the caller
 * (typically `generateMetadata()`) is expected to fall back to the
 * hardcoded copy in `src/app/layout.tsx` for null fields.
 */
export async function getSeoForPath(
  path: string,
  locale: string = "en",
): Promise<SeoData> {
  const norm = normalizeSeoPath(path);
  const loc: SeoLocale = isValidSeoLocale(locale) ? locale : "en";
  const state = await loadCache();
  const override = state.byKey.get(makeKey(norm, loc));
  return mergeSeo(state.defaults, override);
}

/** Pure merger — kept exported for the admin panel preview. */
export function mergeSeo(defaults: SeoData, override: SeoData | undefined): SeoData {
  if (!override) {
    return {
      title: defaults.title,
      description: defaults.description,
      ogImage: defaults.ogImage,
      canonical: defaults.canonical,
    };
  }
  return {
    title: override.title ?? defaults.title,
    description: override.description ?? defaults.description,
    ogImage: override.ogImage ?? defaults.ogImage,
    canonical: override.canonical ?? defaults.canonical,
  };
}

/** Drop the in-process cache. Called by admin write endpoints. */
export function invalidateSeoCache(): void {
  cache = null;
}

// Test-only: same as the public invalidator.
export function _clearSeoCacheForTests(): void {
  cache = null;
}
