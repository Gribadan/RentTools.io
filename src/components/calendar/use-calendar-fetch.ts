import { useCallback, useEffect, useState } from "react";
import type { CalendarLink, DateOverride } from "@/lib/types";
import { useLiveRefresh } from "@/lib/use-live-refresh";
import type { CalendarEvent } from "./types";

type CalendarDataCache = {
  syncedEvents: CalendarEvent[];
  links: CalendarLink[];
  overrides: DateOverride[];
  ts: number;
};

// Module-level per-property cache so switching between recently-viewed
// properties skips the network round-trip (the calendar remounts via `key` on
// every property selection, which would otherwise re-fetch every time).
const calendarDataCache = new Map<number, CalendarDataCache>();
const CALENDAR_CACHE_TTL_MS = 30_000;

// Manual "Sync now" cooldown. POST /api/calendar/sync refreshes this
// property's sources; the background cron already runs every
// 10 minutes, so a manual press is only useful once in a while.
// One press per minute is plenty and keeps a host from hammering the
// droplet. Exported so the calendar UI shows the same number.
export const SYNC_COOLDOWN_MS = 60_000;

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Calendar request failed (${response.status})`);
  return response.json();
}

export interface UseCalendarFetchResult {
  syncedEvents: CalendarEvent[];
  links: CalendarLink[];
  overrides: DateOverride[];
  loadingEvents: boolean;
  syncing: boolean;
  /** Epoch ms of the last successful manual sync, or null. The UI
   *  derives the cooldown countdown + disabled state from this. */
  lastSyncAt: number | null;
  /** True for a few seconds right after a successful manual sync —
   *  drives the "Calendar updated" confirmation. */
  syncJustDone: boolean;
  calendarError: "refresh" | "sync" | null;
  refetchCalendarData: () => Promise<boolean>;
  refetchOverrides: () => Promise<void>;
  handleSyncNow: () => Promise<void>;
}

export function useCalendarFetch(propertyId: number): UseCalendarFetchResult {
  const [syncedEvents, setSyncedEvents] = useState<CalendarEvent[]>(
    () => calendarDataCache.get(propertyId)?.syncedEvents ?? []
  );
  const [links, setLinks] = useState<CalendarLink[]>(
    () => calendarDataCache.get(propertyId)?.links ?? []
  );
  const [overrides, setOverrides] = useState<DateOverride[]>(
    () => calendarDataCache.get(propertyId)?.overrides ?? []
  );
  const [loadingEvents, setLoadingEvents] = useState(() => {
    const cached = calendarDataCache.get(propertyId);
    return !(cached && Date.now() - cached.ts < CALENDAR_CACHE_TTL_MS);
  });
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [syncJustDone, setSyncJustDone] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);

  const refetchCalendarData = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const [syncData, linksData, overridesData] = await Promise.all([
        fetchJson(`/api/calendar/sync?propertyId=${propertyId}&limit=200`),
        fetchJson(`/api/calendar/links?propertyId=${propertyId}`),
        fetchJson(`/api/date-overrides?propertyId=${propertyId}`),
      ]);
      // A failed or malformed response must not erase the last known
      // bookings and make a previously occupied calendar look empty.
      if (!Array.isArray(syncData?.events) || !Array.isArray(linksData) || !Array.isArray(overridesData)) {
        throw new Error("Invalid calendar response");
      }
      const events = syncData.events;
      const linksArr = linksData;
      const overridesArr = overridesData;
      setSyncedEvents(events);
      setLinks(linksArr);
      setOverrides(overridesArr);
      calendarDataCache.set(propertyId, {
        syncedEvents: events,
        links: linksArr,
        overrides: overridesArr,
        ts: Date.now(),
      });
      setRefreshFailed(false);
      return true;
    } catch {
      setRefreshFailed(true);
      return false;
    } finally {
      setLoadingEvents(false);
    }
  }, [propertyId]);

  useEffect(() => {
    const cached = calendarDataCache.get(propertyId);
    const isFresh = cached && Date.now() - cached.ts < CALENDAR_CACHE_TTL_MS;
    if (isFresh) return;
    let active = true;
    queueMicrotask(() => {
      if (active) void refetchCalendarData();
    });
    return () => { active = false; };
  }, [refetchCalendarData, propertyId]);

  // Multi-manager visibility: when Manager A adds a direct booking, we
  // want Manager B's calendar to reflect it without a full page reload.
  // Refetch on tab focus / visibility and poll every 60 s while visible.
  useLiveRefresh(useCallback(async () => {
    await refetchCalendarData();
  }, [refetchCalendarData]));

  const refetchOverrides = useCallback(async () => {
    try {
      const data = await fetchJson(`/api/date-overrides?propertyId=${propertyId}`);
      if (!Array.isArray(data)) throw new Error("Invalid calendar overrides response");
      setOverrides(data);
      const cached = calendarDataCache.get(propertyId);
      if (cached) {
        calendarDataCache.set(propertyId, { ...cached, overrides: data });
      }
    } catch {
      setRefreshFailed(true);
    }
  }, [propertyId]);

  const handleSyncNow = useCallback(async () => {
    if (syncing) return;
    // Client-side cooldown — refuse a press inside the window since the
    // last successful sync. The button is also disabled in the UI, but
    // guarding here too means a programmatic / double-fire call can't
    // slip through.
    if (lastSyncAt && Date.now() - lastSyncAt < SYNC_COOLDOWN_MS) return;
    setSyncing(true);
    setSyncJustDone(false);
    setSyncFailed(false);
    try {
      // Scope the manual sync to THIS property — a host pressing
      // "Sync now" on one calendar shouldn't refetch every other
      // host's feeds. The cron still handles the system-wide pass.
      const result = await fetchJson("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      const refreshed = await refetchCalendarData();
      // The API can return HTTP 200 with per-feed failures. That is a
      // partial sync, not confirmation that every calendar is current.
      if (!result || typeof result.errors !== "number" || result.errors !== 0) {
        setSyncFailed(true);
        return;
      }
      if (!refreshed) return;
      setLastSyncAt(Date.now());
      setSyncJustDone(true);
      // Auto-clear the "updated" confirmation after a few seconds.
      window.setTimeout(() => setSyncJustDone(false), 4000);
    } catch {
      setSyncFailed(true);
    } finally {
      setSyncing(false);
    }
  }, [syncing, lastSyncAt, propertyId, refetchCalendarData]);

  return {
    syncedEvents,
    links,
    overrides,
    loadingEvents,
    syncing,
    lastSyncAt,
    syncJustDone,
    calendarError: refreshFailed ? "refresh" : syncFailed || links.some((link) => !!link.lastError) ? "sync" : null,
    refetchCalendarData,
    refetchOverrides,
    handleSyncNow,
  };
}
