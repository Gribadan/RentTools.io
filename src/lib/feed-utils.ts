/**
 * Pure helpers for the outbound iCal feed routes. Kept separate from
 * `feed.ts` so they can be unit-tested without dragging in Prisma.
 */

/**
 * Parse the platform slug out of an outbound feed filename. The route
 * `/api/calendar/feed/[propertyId]/for-<slug>.ics` accepts any slug a host
 * adds to a property, not just airbnb/booking. Returns `"airbnb"` when the
 * filename doesn't match — preserves the legacy default for malformed
 * requests rather than 400'ing.
 */
export function parseFeedFilename(filename: string): string {
  // Channel labels created from human-readable names commonly contain
  // hyphens (for example `ubytovani-v-chorvatsku`). Treat the complete slug
  // as the target channel; otherwise the legacy fallback to `airbnb` makes
  // genuine Airbnb stays look like same-channel events and silently omits
  // them from that destination's feed.
  const match = filename.match(/^for-([a-z0-9_-]+)\.ics$/i);
  return match?.[1] || "airbnb";
}
