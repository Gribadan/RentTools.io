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

export interface UseCalendarFetchResult {
  syncedEvents: CalendarEvent[];
  links: CalendarLink[];
  overrides: DateOverride[];
  loadingEvents: boolean;
  syncing: boolean;
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
    setSyncing(true);
    try {
      await fetch("/api/calendar/sync", { method: "POST" });
      await refetchCalendarData();
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  }, [syncing, refetchCalendarData]);

  return {
    syncedEvents,
    links,
    overrides,
    loadingEvents,
    syncing,
    refetchCalendarData,
    refetchOverrides,
    handleSyncNow,
  };
}
