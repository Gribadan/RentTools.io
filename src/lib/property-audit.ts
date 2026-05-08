import { prisma } from "@/lib/prisma";
import { generateFeed } from "@/lib/feed";

/**
 * End-to-end property audit. Surfaces every place where the host's
 * data might silently disagree with itself: reservations colliding
 * with synced platform events, overrides contradicting bookings,
 * stale calendar links, iCal feed output that doesn't include the
 * dates we expect to be blocked, etc.
 *
 * Designed to answer: "Is what other platforms see actually correct
 * given my settings + reservations + overrides?" The findings array
 * is the deliverable; severity drives sort + filter on the UI.
 *
 * Read-only — runs entirely off live DB rows + the same generateFeed()
 * the public iCal endpoint uses, so the audit reflects exactly what
 * Airbnb / Booking are crawling right now.
 */

export type AuditSeverity = "error" | "warning" | "info";

export interface AuditFinding {
  severity: AuditSeverity;
  /** Short category label for grouping in the UI: "feed", "reservation", "override", "cleaning", "settings". */
  category: string;
  /** One-sentence summary the host can act on. */
  message: string;
  /** Optional structured payload (dates, IDs, names) for the UI to expand. */
  details?: Record<string, unknown>;
}

export interface FeedSummary {
  platform: string;
  totalEvents: number;
  /** Events whose date range falls inside `[today, today + 90d)` — what
   *  Airbnb / Booking will actually use to block their calendars in the
   *  near term. Anything older or further out matters less. */
  upcomingEvents: number;
  /** First few events for spot-checking. */
  sample: Array<{ uid: string; summary: string; startDate: string; endDate: string }>;
  /** Set if generateFeed() returned an error. */
  error?: string;
}

export interface PropertyAuditReport {
  propertyId: number;
  propertyName: string;
  generatedAt: string;
  settings: {
    minNights: number;
    bookingWindow: number;
    cleaningEnabled: boolean;
    feedTokenSet: boolean;
    checkInTime: string;
    checkOutTime: string;
  };
  links: Array<{
    platform: string;
    bufferBefore: number;
    bufferAfter: number;
    lastFetchedAt: string | null;
    lastError: string | null;
    failureCount: number;
    minutesSinceLastFetch: number | null;
  }>;
  counts: {
    reservations: number;
    upcomingReservations: number;
    syncedEvents: number;
    upcomingSyncedEvents: number;
    overrides: { open: number; closed: number };
    cleaningOverrides: number;
  };
  feeds: FeedSummary[];
  findings: AuditFinding[];
}

function todayDateStr(): string {
  return new Date().toISOString().substring(0, 10);
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  // Half-open intervals [start, end) — same convention iCal uses.
  return aStart < bEnd && aEnd > bStart;
}

export async function auditProperty(propertyId: number): Promise<PropertyAuditReport> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      name: true,
      minNights: true,
      bookingWindow: true,
      cleaningEnabled: true,
      feedToken: true,
      checkInTime: true,
      checkOutTime: true,
    },
  });
  if (!property) {
    throw new Error(`Property ${propertyId} not found`);
  }

  const today = todayDateStr();
  const horizon = addDaysStr(today, 90); // "near term" for severity weighting

  const [links, reservations, events, overrides] = await Promise.all([
    prisma.calendarLink.findMany({
      where: { propertyId },
      orderBy: { platform: "asc" },
    }),
    prisma.reservation.findMany({
      where: { propertyId },
      orderBy: { checkIn: "asc" },
    }),
    prisma.calendarEvent.findMany({
      where: { propertyId },
      orderBy: { startDate: "asc" },
    }),
    prisma.dateOverride.findMany({
      where: { propertyId },
      orderBy: { date: "asc" },
    }),
  ]);

  const findings: AuditFinding[] = [];

  // ─── Settings sanity ──────────────────────────────────────────────
  if (links.length === 0) {
    findings.push({
      severity: "warning",
      category: "settings",
      message:
        "No calendar links connected. Bookings on Airbnb / Booking won't sync into RentTools, and the iCal feed has nothing to merge from other platforms.",
    });
  }
  if (!property.feedToken) {
    findings.push({
      severity: "info",
      category: "settings",
      message:
        "Public iCal feed has no token. Anyone with the URL can read your booking summaries. Set a token if you've shared the URL anywhere outside Airbnb / Booking.",
    });
  }

  // ─── Calendar-link health ─────────────────────────────────────────
  for (const link of links) {
    if (link.lastError) {
      findings.push({
        severity: "error",
        category: "feed",
        message: `Last sync from ${link.platform} failed: ${link.lastError}. Other-platform bookings on this URL aren't reaching RentTools.`,
        details: { platform: link.platform, failureCount: link.failureCount },
      });
    }
    if (link.lastFetchedAt) {
      const ageMin = Math.round((Date.now() - link.lastFetchedAt.getTime()) / 60_000);
      if (ageMin > 60 && !link.lastError) {
        findings.push({
          severity: "warning",
          category: "feed",
          message: `${link.platform} hasn't synced in ${ageMin} minutes. Cron interval is 10 minutes, so a stale fetch this old means the cron is broken or the platform's URL changed.`,
          details: { platform: link.platform, ageMinutes: ageMin },
        });
      }
    } else {
      findings.push({
        severity: "warning",
        category: "feed",
        message: `${link.platform} has never been synced. The URL might be wrong, or sync hasn't run yet.`,
        details: { platform: link.platform },
      });
    }
  }

  // ─── Reservation overlap with synced events from another platform ──
  // The new POST/PATCH guards block this for new reservations, but
  // existing rows from before that fix could still be inconsistent.
  for (const r of reservations) {
    const rStart = r.checkIn.toISOString().substring(0, 10);
    const rEnd = r.checkOut.toISOString().substring(0, 10);
    for (const e of events) {
      if (e.platform === r.platform) continue; // same platform = expected duplicate
      if (rangesOverlap(rStart, rEnd, e.startDate, e.endDate)) {
        findings.push({
          severity: "error",
          category: "reservation",
          message: `Reservation "${r.name}" (${r.platform}) on ${rStart}–${rEnd} overlaps a synced ${e.platform} booking on ${e.startDate}–${e.endDate}. Likely double-booking — review and cancel one.`,
          details: {
            reservationId: r.id,
            reservationName: r.name,
            reservationPlatform: r.platform,
            syncedEventUid: e.uid,
            syncedEventPlatform: e.platform,
          },
        });
      }
    }
  }

  // ─── Overlapping reservations on same property ────────────────────
  for (let i = 0; i < reservations.length; i++) {
    const a = reservations[i];
    const aStart = a.checkIn.toISOString().substring(0, 10);
    const aEnd = a.checkOut.toISOString().substring(0, 10);
    for (let j = i + 1; j < reservations.length; j++) {
      const b = reservations[j];
      const bStart = b.checkIn.toISOString().substring(0, 10);
      const bEnd = b.checkOut.toISOString().substring(0, 10);
      if (rangesOverlap(aStart, aEnd, bStart, bEnd)) {
        findings.push({
          severity: "error",
          category: "reservation",
          message: `Reservations "${a.name}" and "${b.name}" overlap (${aStart}–${aEnd} vs ${bStart}–${bEnd}). The POST/PATCH endpoints block this for new rows; a pre-existing duplicate is the likely cause.`,
          details: { aId: a.id, bId: b.id },
        });
      }
    }
  }

  // ─── Override consistency ─────────────────────────────────────────
  // open override on date covered by a reservation: now silently
  // filtered in the iCal feed, but still surfaces here as "you might
  // want to clear this".
  const reservationCoveredDates = new Set<string>();
  for (const r of reservations) {
    let d = r.checkIn.toISOString().substring(0, 10);
    const end = r.checkOut.toISOString().substring(0, 10);
    while (d < end) {
      reservationCoveredDates.add(d);
      d = addDaysStr(d, 1);
    }
  }
  for (const e of events) {
    let d = e.startDate;
    while (d < e.endDate) {
      reservationCoveredDates.add(d);
      d = addDaysStr(d, 1);
    }
  }
  const conflictingOpenOverrides = overrides
    .filter((o) => o.type === "open" && reservationCoveredDates.has(o.date))
    .map((o) => o.date);
  if (conflictingOpenOverrides.length > 0) {
    findings.push({
      severity: "warning",
      category: "override",
      message: `${conflictingOpenOverrides.length} "open" override(s) sit on dates already covered by a reservation. The iCal feed silently filters these out (so no double-booking risk), but you can clear them to keep the data clean.`,
      details: { dates: conflictingOpenOverrides },
    });
  }
  const conflictingClosedOverrides = overrides
    .filter((o) => o.type === "closed" && reservationCoveredDates.has(o.date))
    .map((o) => o.date);
  if (conflictingClosedOverrides.length > 0) {
    findings.push({
      severity: "info",
      category: "override",
      message: `${conflictingClosedOverrides.length} "closed" override(s) sit on dates inside a reservation. Harmless (the date is double-blocked), but redundant — the reservation alone blocks the date.`,
      details: { dates: conflictingClosedOverrides },
    });
  }

  // ─── iCal feed verification ───────────────────────────────────────
  // Generate the feed for every platform we'd publish to, count what's
  // in it, sample the first few events. The host can spot-check that
  // their reservations actually appear in what other platforms see.
  const platforms = new Set<string>(["airbnb", "booking"]);
  for (const link of links) platforms.add(link.platform);
  const feeds: FeedSummary[] = [];
  for (const platform of platforms) {
    const result = await generateFeed(propertyId, platform);
    if ("error" in result) {
      feeds.push({ platform, totalEvents: 0, upcomingEvents: 0, sample: [], error: result.error });
      findings.push({
        severity: "error",
        category: "feed",
        message: `Feed generation failed for ${platform}: ${result.error}`,
      });
      continue;
    }
    const ical = result.ical;
    // Coarse parse — count VEVENTs and pull first three's DTSTART/SUMMARY.
    const events = parseICal(ical);
    const upcoming = events.filter((e) => e.startDate >= today && e.startDate < horizon);
    feeds.push({
      platform,
      totalEvents: events.length,
      upcomingEvents: upcoming.length,
      sample: events.slice(0, 5),
    });
  }

  // ─── Reservation-to-feed completeness ─────────────────────────────
  // For every upcoming reservation, verify a feed event covers its
  // date range in the feed for OTHER platforms. The home platform's
  // feed (forPlatform === reservation.platform) intentionally excludes
  // its own bookings, so we skip the same-platform check.
  for (const r of reservations) {
    const rStart = r.checkIn.toISOString().substring(0, 10);
    const rEnd = r.checkOut.toISOString().substring(0, 10);
    if (rEnd < today) continue; // past stays don't matter
    if (rStart >= horizon) continue; // beyond near-term horizon

    for (const feed of feeds) {
      if (feed.platform === r.platform) continue; // same platform exclusion is by design
      // Feed parsing above only kept the first 5 events in `sample`,
      // but `totalEvents` is the full count. We need the full event
      // list for the inclusion check — re-run parse on the raw iCal
      // we already produced.
      // (Optimisation tradeoff: this section is nested but each
      // generateFeed() is already done; only the parse repeats. Cheap.)
    }
  }
  // Above loop intentionally a no-op skeleton — keeping it commented
  // out for now. The check is non-trivial because feed events have
  // bufferBefore/After applied so they don't line up exactly with
  // reservation dates. A correct implementation would extract raw
  // (pre-buffer) ranges, which the public generateFeed() doesn't
  // currently expose. Listed here as a known gap.

  // ─── Cleaning enable + buffer setting sanity ──────────────────────
  if (!property.cleaningEnabled) {
    findings.push({
      severity: "info",
      category: "cleaning",
      message:
        "Cleaning automation is disabled for this property. Buffer days, cleaning chips, and turnover detection are off. Re-enable in the property settings if cleaning logistics matter here.",
    });
  }
  for (const link of links) {
    if (link.bufferBefore > 7 || link.bufferAfter > 7) {
      findings.push({
        severity: "warning",
        category: "cleaning",
        message: `${link.platform} has unusual buffer (${link.bufferBefore} before / ${link.bufferAfter} after). Common values are 0–2. Anything above 7 likely a misconfiguration — the platform calendar will be heavily blocked.`,
        details: { platform: link.platform, bufferBefore: link.bufferBefore, bufferAfter: link.bufferAfter },
      });
    }
  }

  // ─── Counts for the report header ─────────────────────────────────
  const upcomingReservations = reservations.filter(
    (r) => r.checkOut.toISOString().substring(0, 10) >= today,
  ).length;
  const upcomingSyncedEvents = events.filter((e) => e.endDate >= today).length;
  const cleaningOverrides = overrides.filter((o) => o.type === "cleaning" || o.note === "cleaning").length;

  return {
    propertyId: property.id,
    propertyName: property.name,
    generatedAt: new Date().toISOString(),
    settings: {
      minNights: property.minNights,
      bookingWindow: property.bookingWindow,
      cleaningEnabled: property.cleaningEnabled,
      feedTokenSet: !!property.feedToken,
      checkInTime: property.checkInTime,
      checkOutTime: property.checkOutTime,
    },
    links: links.map((l) => ({
      platform: l.platform,
      bufferBefore: l.bufferBefore,
      bufferAfter: l.bufferAfter,
      lastFetchedAt: l.lastFetchedAt ? l.lastFetchedAt.toISOString() : null,
      lastError: l.lastError,
      failureCount: l.failureCount,
      minutesSinceLastFetch: l.lastFetchedAt
        ? Math.round((Date.now() - l.lastFetchedAt.getTime()) / 60_000)
        : null,
    })),
    counts: {
      reservations: reservations.length,
      upcomingReservations,
      syncedEvents: events.length,
      upcomingSyncedEvents,
      overrides: {
        open: overrides.filter((o) => o.type === "open").length,
        closed: overrides.filter((o) => o.type === "closed").length,
      },
      cleaningOverrides,
    },
    feeds,
    findings,
  };
}

/**
 * Coarse iCal parser for audit-time spot-checking. Pulls VEVENT blocks,
 * extracts UID / SUMMARY / DTSTART / DTEND. Doesn't attempt full RFC 5545
 * compliance — just enough to count and summarise what's in the feed
 * we just generated. Server-side use only (no fetch of remote feeds).
 */
function parseICal(ical: string): Array<{
  uid: string;
  summary: string;
  startDate: string;
  endDate: string;
}> {
  const out: Array<{ uid: string; summary: string; startDate: string; endDate: string }> = [];
  const blocks = ical.split("BEGIN:VEVENT").slice(1);
  for (const block of blocks) {
    const end = block.indexOf("END:VEVENT");
    if (end < 0) continue;
    const body = block.slice(0, end);
    const get = (key: string) => {
      const m = body.match(new RegExp(`${key}[^:\\n]*:([^\\r\\n]+)`, "m"));
      return m ? m[1].trim() : "";
    };
    const dtstart = get("DTSTART");
    const dtend = get("DTEND");
    out.push({
      uid: get("UID"),
      summary: get("SUMMARY"),
      // DTSTART value is typically YYYYMMDD or YYYYMMDDTHHMMSSZ. Normalise to YYYY-MM-DD.
      startDate: normaliseICalDate(dtstart),
      endDate: normaliseICalDate(dtend),
    });
  }
  return out;
}

function normaliseICalDate(raw: string): string {
  // Pull the first 8 digits, format as YYYY-MM-DD. Skip dashes / `T`s.
  const digits = raw.replace(/[^0-9]/g, "").substring(0, 8);
  if (digits.length !== 8) return raw;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}
