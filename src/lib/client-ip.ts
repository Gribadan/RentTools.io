import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Hash the client IP address into a stable, GDPR-safe identifier.
 *
 * - Reads the inbound IP from `x-forwarded-for` (Cloudflare / nginx
 *   forwards the original client IP here in front of the Next.js
 *   server). Falls back to `x-real-ip`, then to a `unknown` literal.
 * - SHA-256 hex of the IP is what hits the database. We never store
 *   raw IPs — the hash is enough for rate-limit / dedup, and
 *   irreversible enough that a leaked DB doesn't expose user IPs.
 *
 * Used by the feedback API and any future per-IP throttling. Centralised
 * so the hashing scheme stays consistent across surfaces (otherwise two
 * features could rate-limit by different hashes and lose their dedup).
 */
export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers;
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    // x-forwarded-for can be a comma-separated chain — the first entry
    // is the original client. Trim leading/trailing whitespace.
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export function hashClientIp(request: NextRequest | Request): string {
  const ip = getClientIp(request);
  return createHash("sha256").update(ip).digest("hex");
}
