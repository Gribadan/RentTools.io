/**
 * Pure helpers for host-aware SEO output (robots.ts, future sitemap.ts).
 * Kept Prisma-free so the result is unit-testable.
 */

/**
 * True when the request host is a staging / preview / local mirror that
 * should be hidden from search engines. The canonical production hosts
 * (`renttools.io`, `www.renttools.io`) return false. Used by robots.ts
 * to decide whether to emit `Disallow: /` for everything.
 */
export function isStagingHost(rawHost: string | null | undefined): boolean {
  if (!rawHost) return false;
  const host = rawHost.toLowerCase().split(":")[0];
  if (host === "renttools.io" || host === "www.renttools.io") return false;
  return (
    host.startsWith("staging.") ||
    host.includes(".staging.") ||
    host.startsWith("dev.") ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".ondigitalocean.app") ||
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1")
  );
}
