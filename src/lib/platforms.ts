/**
 * Calendar platform preset registry (RT-17.1). One source of truth for
 * the slugs / display names / colors used everywhere a CalendarLink
 * picks a platform — onboard wizard, dashboard sync settings, calendar
 * grid color coding.
 *
 * Reads are cached in-process for 60 seconds so the calendar grid
 * doesn't hit the DB on every render. Mutations from the admin panel
 * (RT-17.1 tick 2) call invalidatePlatformCache() to flush; multi-instance
 * deploys see eventual consistency within 60s of a write.
 *
 * If the DB is unreachable, getPlatforms() falls back to the bundled
 * PLATFORM_PRESETS so the UI can still render the baseline 12 platforms.
 */

export interface PlatformPreset {
  slug: string;
  displayName: string;
  color: string; // hex (#rrggbb)
  iconUrl: string | null;
  defaultBufferBefore: number;
  defaultBufferAfter: number;
  importInstructionsKey: string | null;
  exportInstructionsKey: string | null;
  isCustom: boolean;
  enabled: boolean;
  sortOrder: number;
}

export const FALLBACK_PLATFORM_COLOR = "#6B7280";

function preset(
  slug: string,
  displayName: string,
  color: string,
  sortOrder: number,
  overrides?: Partial<PlatformPreset>,
): PlatformPreset {
  return {
    slug,
    displayName,
    color,
    iconUrl: null,
    defaultBufferBefore: 1,
    defaultBufferAfter: 1,
    importInstructionsKey: `platform.${slug}.import`,
    exportInstructionsKey: `platform.${slug}.export`,
    isCustom: false,
    enabled: true,
    sortOrder,
    ...overrides,
  };
}

// Bundled baseline. Mirrors the seed in prisma/push-schema.ts so the
// process can serve the canonical 12 even if the DB is briefly down.
export const PLATFORM_PRESETS: ReadonlyArray<PlatformPreset> = [
  preset("airbnb", "Airbnb", "#FF385C", 10),
  preset("booking", "Booking.com", "#003580", 20),
  preset("vrbo", "Vrbo", "#245ABC", 30),
  preset("expedia", "Expedia", "#FFC72C", 40),
  preset("hostaway", "Hostaway", "#2E5BFF", 50),
  preset("lodgify", "Lodgify", "#00B5AD", 60),
  preset("hospitable", "Hospitable", "#1B5E20", 70),
  preset("smoobu", "Smoobu", "#4A148C", 80),
  preset("houfy", "Houfy", "#D84315", 90),
  preset("plumguide", "Plum Guide", "#2E1065", 100),
  preset("whimstay", "Whimstay", "#FF7043", 110),
  preset("direct", "Direct", FALLBACK_PLATFORM_COLOR, 200, {
    defaultBufferBefore: 0,
    defaultBufferAfter: 0,
  }),
];

// Slugs are URL path components (`/api/calendar/feed/[id]/for-{slug}.ics`)
// so the canonical form is lowercase ASCII alphanumerics + dashes,
// 1–32 chars, no leading/trailing dash. The 32-char cap keeps generated
// filenames within filesystem limits on the destination platforms.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Coerce arbitrary user input (e.g. "Plum Guide", "Édgar's Place") into
 * the canonical platform slug shape. Strips diacritics, lowercases,
 * collapses non-alphanumeric runs to a single dash, trims edge dashes,
 * caps at 32 chars. Returns "" if nothing usable survives.
 */
export function normalizePlatformSlug(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

/** True iff the slug matches the canonical form normalizePlatformSlug produces. */
export function isValidPlatformSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

/**
 * Resolve a hex color, falling back to neutral gray when the stored
 * value is empty / malformed. Keeps the calendar grid from rendering a
 * transparent strip if an admin clears the color field.
 */
export function resolvePlatformColor(color: string | null | undefined): string {
  if (!color) return FALLBACK_PLATFORM_COLOR;
  return HEX_COLOR_RE.test(color) ? color : FALLBACK_PLATFORM_COLOR;
}

const CACHE_TTL_MS = 60_000;

interface CacheState {
  expiresAt: number;
  bySlug: Map<string, PlatformPreset>;
  ordered: PlatformPreset[];
}

let cache: CacheState | null = null;

async function loadCache(): Promise<CacheState> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache;

  let rows: PlatformPreset[];
  try {
    // Lazy import keeps the prisma client off this module's import graph,
    // so pure-helper tests (slug normalisation etc.) don't need a DB env.
    const { prisma } = await import("@/lib/prisma");
    const dbRows = await prisma.calendarPlatform.findMany({
      orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }],
    });
    rows = dbRows.map((r) => ({
      slug: r.slug,
      displayName: r.displayName,
      color: resolvePlatformColor(r.color),
      iconUrl: r.iconUrl,
      defaultBufferBefore: r.defaultBufferBefore,
      defaultBufferAfter: r.defaultBufferAfter,
      importInstructionsKey: r.importInstructionsKey,
      exportInstructionsKey: r.exportInstructionsKey,
      isCustom: r.isCustom,
      enabled: r.enabled,
      sortOrder: r.sortOrder,
    }));
  } catch {
    rows = PLATFORM_PRESETS.map((p) => ({ ...p }));
  }

  // Empty table on a fresh install = serve the bundled presets so the
  // first render before push-schema lands isn't a blank dropdown.
  if (rows.length === 0) {
    rows = PLATFORM_PRESETS.map((p) => ({ ...p }));
  }

  const bySlug = new Map(rows.map((p) => [p.slug, p]));
  cache = { expiresAt: now + CACHE_TTL_MS, bySlug, ordered: rows };
  return cache;
}

/** All platforms in display order (sortOrder asc, then displayName asc). */
export async function getPlatforms(opts?: { enabledOnly?: boolean }): Promise<PlatformPreset[]> {
  const state = await loadCache();
  return opts?.enabledOnly ? state.ordered.filter((p) => p.enabled) : state.ordered.slice();
}

/**
 * Resolve a single platform by slug. Falls back to the bundled preset
 * when the DB is empty or the slug isn't seeded yet — keeps existing
 * CalendarLink rows that reference an obscure slug from breaking.
 */
export async function getPlatformBySlug(slug: string): Promise<PlatformPreset | null> {
  const state = await loadCache();
  const hit = state.bySlug.get(slug);
  if (hit) return hit;
  return PLATFORM_PRESETS.find((p) => p.slug === slug) ?? null;
}

/** Drop the in-process cache. Called by admin write endpoints in tick 2. */
export function invalidatePlatformCache(): void {
  cache = null;
}

// Test-only: same as the public invalidator.
export function _clearPlatformsCacheForTests(): void {
  cache = null;
}
