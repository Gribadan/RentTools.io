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
  // `-` is part of the canonical slug shape (see SLUG_RE in lib/platforms),
  // but `\w` excludes it, so a dashed slug such as `my-cottage` used to fall
  // through to the "airbnb" default. That is worse than a 404: the caller
  // then serves the Airbnb feed, which deliberately omits Airbnb stays, so
  // the destination silently receives a calendar with bookings missing.
  const match = filename.match(/^for-([\w-]+)\.ics$/i);
  return match?.[1] || "airbnb";
}
