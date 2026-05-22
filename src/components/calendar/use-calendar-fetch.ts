import { useCallback, useEffect, useState } from "react";
import type { CalendarLink, DateOverride } from "@/lib/types";
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

// Manual "Sync now" cooldown. POST /api/calendar/sync triggers a
// system-wide calendar sync; the background cron already runs it every
// 10 minutes, so a manual press is only useful once in a while.
// One press per minute is plenty and keeps a host from hammering the
// droplet. Exported so the calendar UI shows the same number.
export const SYNC_COOLDOWN_MS = 60_000;

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
  refetchCalendarData: () => Promise<void>;
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

  const refetchCalendarData = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const [syncData, linksData, overridesData] = await Promise.all([
        fetch(`/api/calendar/sync?propertyId=${propertyId}&limit=200`).then(r => r.json()),
        fetch(`/api/calendar/links?propertyId=${propertyId}`).then(r => r.json()),
        fetch(`/api/date-overrides?propertyId=${propertyId}`).then(r => r.json()),
      ]);
      const events = syncData.events || [];
      const linksArr = linksData || [];
      const overridesArr = overridesData || [];
      setSyncedEvents(events);
      setLinks(linksArr);
      setOverrides(overridesArr);
      calendarDataCache.set(propertyId, {
        syncedEvents: events,
        links: linksArr,
        overrides: overridesArr,
        ts: Date.now(),
      });
    } catch {
      // ignore
    } finally {
      setLoadingEvents(false);
    }
  }, [propertyId]);

  useEffect(() => {
    const cached = calendarDataCache.get(propertyId);
    const isFresh = cached && Date.now() - cached.ts < CALENDAR_CACHE_TTL_MS;
    if (!isFresh) refetchCalendarData();
  }, [refetchCalendarData, propertyId]);

  const refetchOverrides = useCallback(async () => {
    const res = await fetch(`/api/date-overrides?propertyId=${propertyId}`);
    const data = await res.json();
    const overridesArr = data || [];
    setOverrides(overridesArr);
    const cached = calendarDataCache.get(propertyId);
    if (cached) {
      calendarDataCache.set(propertyId, { ...cached, overrides: overridesArr, ts: Date.now() });
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
    try {
      await fetch("/api/calendar/sync", { method: "POST" });
      await refetchCalendarData();
      setLastSyncAt(Date.now());
      setSyncJustDone(true);
      // Auto-clear the "updated" confirmation after a few seconds.
      window.setTimeout(() => setSyncJustDone(false), 4000);
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  }, [syncing, lastSyncAt, refetchCalendarData]);

  return {
    syncedEvents,
    links,
    overrides,
    loadingEvents,
    syncing,
    lastSyncAt,
    syncJustDone,
    refetchCalendarData,
    refetchOverrides,
    handleSyncNow,
  };
}
