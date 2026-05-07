import type { CalendarLink } from "@/lib/types";
import type { Locale } from "@/lib/i18n/translations";

export interface SyncHealth {
  ok: boolean;
  message: string;
}

interface SyncHealthCopyShape {
  neverSynced: string;
  justNow: string;
  minutesAgo: (m: number) => string;
  hoursAgo: (h: number) => string;
  daysAgo: (d: number) => string;
  syncedPrefix: (label: string) => string;
}

const COPY: Record<Locale, SyncHealthCopyShape> = {
  en: {
    neverSynced: "Never synced",
    justNow: "just now",
    minutesAgo: (m) => `${m}m ago`,
    hoursAgo: (h) => `${h}h ago`,
    daysAgo: (d) => `${d}d ago`,
    syncedPrefix: (label) => `Synced ${label}`,
  },
  ru: {
    neverSynced: "Не синхронизировано",
    justNow: "только что",
    minutesAgo: (m) => `${m} мин. назад`,
    hoursAgo: (h) => `${h} ч. назад`,
    daysAgo: (d) => `${d} дн. назад`,
    syncedPrefix: (label) => `Синхр. ${label}`,
  },
  de: {
    neverSynced: "Noch nicht synchronisiert",
    justNow: "gerade eben",
    minutesAgo: (m) => `vor ${m} Min.`,
    hoursAgo: (h) => `vor ${h} Std.`,
    daysAgo: (d) => `vor ${d} ${d === 1 ? "Tag" : "Tagen"}`,
    syncedPrefix: (label) => `Synchronisiert ${label}`,
  },
};

export function computeSyncHealth(links: CalendarLink[], locale: Locale): SyncHealth | null {
  if (!links || links.length === 0) return null;
  const c = COPY[locale];
  const errored = links.find(l => l.lastError);
  const lastFetchedTimes = links
    .map(l => l.lastFetchedAt ? new Date(l.lastFetchedAt).getTime() : 0)
    .filter(t => t > 0);
  const lastFetched = lastFetchedTimes.length > 0 ? Math.max(...lastFetchedTimes) : 0;
  if (errored) return { ok: false, message: errored.lastError || "Sync error" };
  if (!lastFetched) return { ok: false, message: c.neverSynced };
  const m = Math.round((Date.now() - lastFetched) / 60000);
  let label: string;
  if (m < 1) label = c.justNow;
  else if (m < 60) label = c.minutesAgo(m);
  else {
    const h = Math.round(m / 60);
    if (h < 24) label = c.hoursAgo(h);
    else label = c.daysAgo(Math.round(h / 24));
  }
  return { ok: true, message: c.syncedPrefix(label) };
}
