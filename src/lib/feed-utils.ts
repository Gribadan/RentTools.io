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
  const match = filename.match(/^for-(\w+)\.ics$/i);
  return match?.[1] || "airbnb";
}
