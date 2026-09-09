import { prisma } from "@/lib/prisma";
import { parseICal, type ICalEvent } from "@/lib/ical";

/**
 * Fetch and parse an iCal feed from a URL.
 */
async function fetchICal(url: string): Promise<{ events: ICalEvent[]; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent": "RentTool-CalendarSync/1.0",
        Accept: "text/calendar, text/plain, */*",
      },
    });
    if (!res.ok) {
      return { events: [], error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const text = await res.text();
    const events = parseICal(text);
    return { events };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { events: [], error: msg };
  } finally {
    // Keep the timeout active while reading the body as well as the headers.
    clearTimeout(timeout);
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
  updatedEvents: number;
  removedEvents: number;
  errors: number;
}> {
  const summary = { propertiesSynced: 0, newEvents: 0, updatedEvents: 0, removedEvents: 0, errors: 0 };

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
        const futureEvents = events.filter((e) => {
          if (e.endDate < today) return false;
          if (e.uid.startsWith("renttool-")) return false;
          if (e.summary.includes("Blocked (") && e.summary.includes("+buffer")) return false;
          if (e.summary === "Blocked (cleaning)") return false;
          return true;
        });

        // A one-night CLOSED/Not available event can be a real reservation,
        // even when another stay begins next day. Adjacency is not evidence
        // that a block came from RentTools; only the markers above are.

        // Apply one complete snapshot atomically. A feed request must not see
        // a half-reconciled event set, and a failed guest-link update must not
        // leave its source event deleted. Network I/O stays outside the lock.
        const { newEvents, updatedEvents, removedUIDs, migratedReservations, unlinkedReservations } =
          await prisma.$transaction(async (tx) => {
            // Get existing events for this property+platform
            const existing = await tx.calendarEvent.findMany({
              where: { propertyId, platform: link.platform },
            });
            const existingUIDs = new Set(existing.map((e) => e.uid));
            const existingByUID = new Map(existing.map((e) => [e.uid, e]));
            const fetchedUIDs = new Set(futureEvents.map((e) => e.uid));

            // Detect new events
            const newEvents = futureEvents.filter((e) => !existingUIDs.has(e.uid));
            const updatedEvents = futureEvents.filter((event) => {
              const previous = existingByUID.get(event.uid);
              return previous && (previous.startDate !== event.startDate ||
                previous.endDate !== event.endDate || previous.summary !== event.summary);
            });

            // Detect removed events (no longer in feed). Keep the full
            // event rows (not just uids) so the prune step below can read
            // each event's date range when migrating or unlinking every local
            // claim/direct-extension segment attached to it.
            const removedEvents = existing.filter(
              (e) => !fetchedUIDs.has(e.uid) && e.endDate >= today
            );
            const removedUIDs = removedEvents.map((e) => e.uid);

            // Providers commonly keep a UID when editing a stay. Reconcile changed
            // dates as well as new UIDs, otherwise checkout stays stale forever.
            for (const event of [...newEvents, ...updatedEvents]) {
              await tx.calendarEvent.upsert({
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
            //
            // A "removed" event may actually be a UID REISSUE, not a
            // cancellation — Booking.com in particular mints a fresh UID on
            // almost every booking edit (arrival-time change, room-code
            // change, guest edit). Before treating a vanished event as a
            // real cancellation, check whether newEvents contains a same-
            // platform event whose date range OVERLAPS the vanished one.
            // If yes, migrate any linked Reservation to point at the new
            // UID (preserving the host's name, guests, and passport docs)
            // instead of nuking them. If no match, still preserve the
            // Reservation by UNLINKING it (linkedEventUid = null) so guest
            // data survives the platform's cancellation and the host can
            // review and delete manually if desired.
            let migratedReservations = 0;
            let unlinkedReservations = 0;
            if (removedEvents.length > 0) {
              for (const ev of removedEvents) {
                const deleted = await tx.calendarEvent.deleteMany({
                  where: {
                    propertyId,
                    platform: link.platform,
                    uid: ev.uid,
                    endDate: { gte: today },
                  },
                });

                if (deleted.count > 0) {
                  // UID reissue detection: does a newly-appearing event on
                  // the same platform overlap the vanished one's dates?
                  // Overlap uses the standard half-open predicate; if
                  // multiple candidates match, prefer the one with the
                  // largest date-range intersection (usually there's just
                  // one). Summary similarity is a secondary hint but not
                  // required — Booking normalises "CLOSED - Not available"
                  // across host-blocks and reservations alike.
                  const overlap = (candidate: ICalEvent) => Math.max(0,
                    Date.parse(candidate.endDate < ev.endDate ? candidate.endDate : ev.endDate) -
                    Date.parse(candidate.startDate > ev.startDate ? candidate.startDate : ev.startDate),
                  );
                  const candidateReissue = newEvents.filter((event) => overlap(event) > 0)
                    .sort((a, b) => overlap(b) - overlap(a))[0];

                  if (candidateReissue) {
                    const migrated = await tx.reservation.updateMany({
                      where: {
                        propertyId,
                        linkedEventUid: ev.uid,
                        OR: [
                          { linkedEventPlatform: link.platform },
                          // Compatibility for rows created before source platform
                          // became independent from the booking channel.
                          { linkedEventPlatform: null, platform: link.platform },
                        ],
                      },
                      data: { linkedEventUid: candidateReissue.uid },
                    });
                    migratedReservations += migrated.count;
                  } else {
                    // No reissue candidate — treat as a real cancellation.
                    // NEVER auto-delete a linked Reservation (it may carry
                    // guest passports or a paid Direct extension). Clear the
                    // complete relationship on both claims and extensions so
                    // each local row survives as an independent manual entry.
                    const unlinked = await tx.reservation.updateMany({
                      where: {
                        propertyId,
                        linkedEventUid: ev.uid,
                        OR: [
                          { linkedEventPlatform: link.platform },
                          { linkedEventPlatform: null, platform: link.platform },
                        ],
                      },
                      data: {
                        linkedEventUid: null,
                        linkedEventPlatform: null,
                        linkedEventRole: null,
                      },
                    });
                    unlinkedReservations += unlinked.count;
                  }
                }
              }
            }

            // Update link status
            await tx.calendarLink.update({
              where: { id: link.id },
              data: { lastFetchedAt: new Date(), lastError: null, failureCount: 0 },
            });
            return { newEvents, updatedEvents, removedUIDs, migratedReservations, unlinkedReservations };
          });

        summary.newEvents += newEvents.length;
        summary.updatedEvents += updatedEvents.length;
        summary.removedEvents += removedUIDs.length;

        if (newEvents.length > 0) {
          await log(
            `${propertyName} / ${link.platform}: ${newEvents.length} new booking(s) detected — ${newEvents.map((e) => `${e.summary || "Blocked"} (${e.startDate} → ${e.endDate})`).join(", ")}`,
            "success",
            propertyId
          );
        }
        if (updatedEvents.length > 0) {
          await log(
            `${propertyName} / ${link.platform}: ${updatedEvents.length} booking(s) updated (dates or summary changed)`,
            "success",
            propertyId,
          );
        }
        if (removedUIDs.length > 0) {
          const parts: string[] = [];
          if (migratedReservations > 0) {
            parts.push(`${migratedReservations} reservation(s) migrated to reissued UID (name + guests preserved)`);
          }
          if (unlinkedReservations > 0) {
            parts.push(`${unlinkedReservations} reservation(s) unlinked (kept as manual; guest data preserved)`);
          }
          await log(
            `${propertyName} / ${link.platform}: ${removedUIDs.length} feed event(s) removed${
              parts.length > 0 ? ` — ${parts.join(", ")}` : ""
            }`,
            "warn",
            propertyId
          );
        }
      } catch (err) {
        summary.errors++;
        const msg = err instanceof Error ? err.message : String(err);
        try {
          await prisma.calendarLink.update({
            where: { id: link.id },
            data: {
              lastError: `Sync failed: ${msg}`,
              lastFetchedAt: new Date(),
              failureCount: { increment: 1 },
            },
          });
        } catch {
          // The same database outage may also prevent recording link health.
        }
        await log(
          `${propertyName} / ${link.platform}: Unexpected error — ${msg}`,
          "error",
          propertyId
        );
      }
    }

    // ── Orphan cleanup ──────────────────────────────────────────────
    // If a previous sync pruned a CalendarEvent but the linked
    // Reservation still points at that UID, the per-event cleanup
    // above can't reach it — the event row is gone so it never
    // appears in removedEvents.
    //
    // Previously we DELETED those reservations here, which produced
    // the exact data-loss the per-event branch above now guards
    // against: a UID reissue between two syncs would leave the
    // reservation orphaned for a beat, and the next sync's orphan
    // pass would nuke it (guests, passports, uploaded documents and
    // all). Never delete. UNLINK instead — the reservation stays on
    // the calendar as a manual entry the host can review, keep, or
    // delete themselves.
    try {
      const linkedReservations = await prisma.reservation.findMany({
        where: {
          propertyId,
          linkedEventUid: { not: null },
        },
        select: {
          id: true,
          platform: true,
          linkedEventUid: true,
          linkedEventPlatform: true,
        },
      });

      if (linkedReservations.length > 0) {
        const linkedPairs = [
          ...new Map(
            linkedReservations.map((reservation) => {
              const sourcePlatform =
                reservation.linkedEventPlatform || reservation.platform;
              return [
                `${sourcePlatform}\u0000${reservation.linkedEventUid}`,
                {
                  platform: sourcePlatform,
                  uid: reservation.linkedEventUid!,
                },
              ] as const;
            }),
          ).values(),
        ];
        const existingEvents = await prisma.calendarEvent.findMany({
          where: {
            propertyId,
            OR: linkedPairs,
          },
          select: { platform: true, uid: true },
        });
        const existingSourceSet = new Set(
          existingEvents.map((event) => `${event.platform}\u0000${event.uid}`),
        );
        const orphanIds = linkedReservations
          .filter((reservation) => {
            const sourcePlatform =
              reservation.linkedEventPlatform || reservation.platform;
            return !existingSourceSet.has(
              `${sourcePlatform}\u0000${reservation.linkedEventUid}`,
            );
          })
          .map((reservation) => reservation.id);

        if (orphanIds.length > 0) {
          await prisma.reservation.updateMany({
            where: { id: { in: orphanIds } },
            data: {
              linkedEventUid: null,
              linkedEventPlatform: null,
              linkedEventRole: null,
            },
          });
          await log(
            `${propertyName}: ${orphanIds.length} orphaned reservation(s) unlinked (linked event no longer exists — data preserved as manual reservation)`,
            "warn",
            propertyId
          );
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await log(
        `${propertyName}: Orphan cleanup failed — ${msg}`,
        "error",
        propertyId
      );
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
    `Sync complete: ${summary.propertiesSynced} properties, ${summary.newEvents} new, ${summary.updatedEvents} updated, ${summary.removedEvents} removed, ${summary.errors} errors`,
    summary.errors > 0 ? "warn" : "success"
  );

  return summary;
}
