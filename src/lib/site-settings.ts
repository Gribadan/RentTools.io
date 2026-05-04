import { prisma } from "@/lib/prisma";

/**
 * Site-wide key/value config (signup gate, rate limits, announcements).
 *
 * Reads are cached in-process for 60 seconds so that hot paths (signup
 * endpoint, extraction handler, landing announcement banner) don't hit the
 * DB on every request. The cache is per-process — multi-instance deploys
 * see eventual consistency within 60s of a write.
 *
 * Writes invalidate the cache for the affected key on the writing process.
 */

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  value: string | null; // null = "not set in DB"
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export async function getSetting(key: string, fallback: string): Promise<string> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value ?? fallback;
  }
  let value: string | null = null;
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    value = row?.value ?? null;
  } catch {
    // DB unavailable — fall through to fallback, don't cache
    return fallback;
  }
  cache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
  return value ?? fallback;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value, updatedAt: new Date() },
    create: { key, value, updatedAt: new Date() },
  });
  // Invalidate this process's cache so the next read sees the new value.
  cache.delete(key);
}

// Test-only: clear the in-process cache. Vitest can call this between cases.
export function _clearSettingsCacheForTests(): void {
  cache.clear();
}
