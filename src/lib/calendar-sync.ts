import { prisma } from "@/lib/prisma";
import { parseICal, type ICalEvent } from "@/lib/ical";

/**
 * Fetch and parse an iCal feed from a URL.
 */
async function fetchICal(url: string): Promise<{ events: ICalEvent[]; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "RentTool-CalendarSync/1.0",
        Accept: "text/calendar, text/plain, */*",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { events: [], error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const text = await res.text();
    if (!text.includes("VCALENDAR")) {
      return { events: [], error: "Response is not a valid iCal feed" };
    }

    const events = parseICal(text);
    return { events };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { events: [], error: msg };
  }
}

/**
 * Log a sync message to the database.
 */
async function log(
  message: string,
  level: "info" | "warn" | "error" | "success" = "info",
  propertyId?: number
) {
  try {
    await prisma.syncLog.create({
      data: { message, level, propertyId: propertyId ?? null },
    });
  } catch {
    console.error("[SyncLog]", level, message);
  }
}

/**
 * Sync calendar links and return a summary of what happened.
 *
 * With no options it syncs every calendar link in the system — this is
 * what the background cron does. Pass `propertyIds` to restrict the
 * sync to a specific set of properties: the manual "Sync now" button
 * uses this so a host's click only refreshes their own property (or
 * properties), not every other host's feeds. Scoping it keeps a manual
 * press cheap on the small droplet.
 */
export async function syncAllCalendars(opts?: {
  propertyIds?: number[];
}): Promise<{
  propertiesSynced: number;
  newEvents: number;
  removedEvents: number;
  errors: number;
}> {
  const summary = { propertiesSynced: 0, newEvents: 0, removedEvents: 0, errors: 0 };

  // An empty (but present) propertyIds list means "nothing to sync" —
  // return early rather than letting `in: []` fall through.
  if (opts?.propertyIds && opts.propertyIds.length === 0) return summary;

  // Get the calendar links to sync, grouped by property. When scoped,
  // only the requested properties' links are fetched.
  const links = await prisma.calendarLink.findMany({
    where: opts?.propertyIds ? { propertyId: { in: opts.propertyIds } } : undefined,
    include: { property: true },
  });

  if (links.length === 0) return summary;

  // Group by property
  const byProperty = new Map<number, typeof links>();
  for (const link of links) {
    const arr = byProperty.get(link.propertyId) || [];
    arr.push(link);
    byProperty.set(link.propertyId, arr);
  }

  await log(`Sync started: ${byProperty.size} properties, ${links.length} feeds`);

  for (const [propertyId, propertyLinks] of byProperty) {
    const propertyName = propertyLinks[0]?.property?.name || `#${propertyId}`;

    for (const link of propertyLinks) {
      try {
        const { events, error } = await fetchICal(link.icalExportUrl);

        if (error) {
          summary.errors++;
          const updated = await prisma.calendarLink.update({
            where: { id: link.id },
            data: {
              lastError: error,
              lastFetchedAt: new Date(),
              failureCount: { increment: 1 },
            },
          });
          await log(
            `${propertyName} / ${link.platform}: Fetch failed — ${error}`,
            "error",
            propertyId
          );
          if (updated.failureCount === 3) {
            await log(
              `[ALERT] ${propertyName} / ${link.platform}: 3 consecutive sync failures — the feed may be broken. Latest error: ${error}`,
              "error",
              propertyId
            );
          }
          continue;
        }

        // Filter to future events only, and skip events created by our own RentTool feed
        // (prevents feedback loop: our buffer → imported by platform → re-synced as booking)
        const today = new Date().toISOString().substring(0, 10);

        // Skip events created by our own RentTool feed (feedback loop prevention)
        const filteredEvents = events.filter((e) => {
          if (e.endDate < today) return false;
          if (e.uid.startsWith("renttool-")) return false;
          if (e.summary.includes("Blocked (") && e.summary.includes("+buffer")) return false;
          if (e.summary === "Blocked (cleaning)") return false;
          return true;
        });

        // Also filter out 1-day "CLOSED" blocks that sit right before another event
        // (likely our own buffer day reflected back by the platform)
        const futureEvents = filteredEvents.filter((e) => {
          // Only check 1-day events with "CLOSED" or "Not available" summary
          const duration = Math.round(
            (new Date(e.endDate + "T12:00:00Z").getTime() - new Date(e.startDate + "T12:00:00Z").getTime()) / (1000 * 60 * 60 * 24)
          );
          if (duration > 1) return true; // keep multi-day events
          if (!e.summary.includes("CLOSED") && !e.summary.includes("Not available")) return true;

          // Check if this 1-day block is immediately before another event
          const nextDay = e.endDate; // exclusive end = next day
          const hasAdjacentEvent = filteredEvents.some(
            (other) => other !== e && other.startDate === nextDay
          );
          if (hasAdjacentEvent) {
            // This is likely a reflected buffer day — skip it
            return false;
          }
          return true;
        });

        // Get existing events for this property+platform
        const existing = await prisma.calendarEvent.findMany({
          where: { propertyId, platform: link.platform },
        });
        const existingUIDs = new Set(existing.map((e) => e.uid));
        const fetchedUIDs = new Set(futureEvents.map((e) => e.uid));

        // Detect new events
        const newEvents = futureEvents.filter((e) => !existingUIDs.has(e.uid));

        // Detect removed events (no longer in feed)
        const removedUIDs = existing
          .filter((e) => !fetchedUIDs.has(e.uid) && e.endDate >= today)
          .map((e) => e.uid);

        // Insert new events
        for (const event of newEvents) {
          await prisma.calendarEvent.upsert({
            where: {
              propertyId_platform_uid: {
                propertyId,
                platform: link.platform,
                uid: event.uid,
              },
            },
            create: {
              propertyId,
              platform: link.platform,
              uid: event.uid,
              summary: event.summary,
              startDate: event.startDate,
              endDate: event.endDate,
            },
            update: {
              summary: event.summary,
              startDate: event.startDate,
              endDate: event.endDate,
            },
          });
        }

        // Remove events no longer in the feed — but ONLY if they're
        // still upcoming. Most platforms (Airbnb, Booking.com) trim
        // past stays from their iCal feeds after some rolling window
        // (a few months); without this guard our DB silently loses
        // every historical booking, which kills the Reports page's
        // ability to show year-over-year history. Past stays get
        // preserved forever; cancellations of upcoming stays still
        // get pruned on schedule.
        if (removedUIDs.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayIso = today.toISOString().substring(0, 10);
          for (const uid of removedUIDs) {
            await prisma.calendarEvent.deleteMany({
              where: {
                propertyId,
                platform: link.platform,
                uid,
                endDate: { gte: todayIso },
              },
            });
          }
        }

        // Update link status
        await prisma.calendarLink.update({
          where: { id: link.id },
          data: { lastFetchedAt: new Date(), lastError: null, failureCount: 0 },
        });

        summary.newEvents += newEvents.length;
        summary.removedEvents += removedUIDs.length;

        if (newEvents.length > 0) {
          await log(
            `${propertyName} / ${link.platform}: ${newEvents.length} new booking(s) detected — ${newEvents.map((e) => `${e.summary || "Blocked"} (${e.startDate} → ${e.endDate})`).join(", ")}`,
            "success",
            propertyId
          );
        }
        if (removedUIDs.length > 0) {
          await log(
            `${propertyName} / ${link.platform}: ${removedUIDs.length} cancelled booking(s) removed`,
            "warn",
            propertyId
          );
        }
      } catch (err) {
        summary.errors++;
        const msg = err instanceof Error ? err.message : String(err);
        await log(
          `${propertyName} / ${link.platform}: Unexpected error — ${msg}`,
          "error",
          propertyId
        );
      }
    }

    summary.propertiesSynced++;
  }

  // Clean old logs (keep last 500)
  try {
    const cutoff = await prisma.syncLog.findMany({
      orderBy: { id: "desc" },
      skip: 500,
      take: 1,
      select: { id: true },
    });
    if (cutoff.length > 0) {
      await prisma.syncLog.deleteMany({
        where: { id: { lt: cutoff[0].id } },
      });
    }
  } catch {
    // Not critical
  }

  await log(
    `Sync complete: ${summary.propertiesSynced} properties, ${summary.newEvents} new, ${summary.removedEvents} removed, ${summary.errors} errors`,
    summary.errors > 0 ? "warn" : "success"
  );

  return summary;
}
