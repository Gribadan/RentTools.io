import type { CalendarLink } from "@/lib/types";

export interface SyncHealth {
  ok: boolean;
  message: string;
}

export function computeSyncHealth(links: CalendarLink[], locale: string): SyncHealth | null {
  if (!links || links.length === 0) return null;
  const errored = links.find(l => l.lastError);
  const lastFetchedTimes = links
    .map(l => l.lastFetchedAt ? new Date(l.lastFetchedAt).getTime() : 0)
    .filter(t => t > 0);
  const lastFetched = lastFetchedTimes.length > 0 ? Math.max(...lastFetchedTimes) : 0;
  if (errored) return { ok: false, message: errored.lastError || "Sync error" };
  if (!lastFetched) return { ok: false, message: locale === "ru" ? "Не синхронизировано" : "Never synced" };
  const m = Math.round((Date.now() - lastFetched) / 60000);
  let label: string;
  if (m < 1) label = locale === "ru" ? "только что" : "just now";
  else if (m < 60) label = locale === "ru" ? `${m} мин. назад` : `${m}m ago`;
  else {
    const h = Math.round(m / 60);
    if (h < 24) label = locale === "ru" ? `${h} ч. назад` : `${h}h ago`;
    else label = locale === "ru" ? `${Math.round(h / 24)} дн. назад` : `${Math.round(h / 24)}d ago`;
  }
  return { ok: true, message: locale === "ru" ? `Синхр. ${label}` : `Synced ${label}` };
}
