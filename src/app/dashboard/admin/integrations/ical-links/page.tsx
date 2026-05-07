"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface CopyShape {
  title: string;
  description: string;
  loadFailed: string;
  loading: string;
  empty: string;
  errorBanner: (count: number) => string;
  openSync: string;
  okBadge: string;
  errorBadge: string;
  never: string;
  justNow: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  daysAgo: (n: number) => string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "iCal links",
    description:
      "All calendar feeds connected across your properties. Click a property to open its Sync settings.",
    loadFailed: "Failed to load",
    loading: "Loading...",
    empty: "No iCal links connected yet. Add them on each property's Sync settings tab.",
    errorBanner: (count) =>
      `${count} link${count === 1 ? "" : "s"} reporting an error. Open the property to check the URL.`,
    openSync: "Open Sync",
    okBadge: "OK",
    errorBadge: "Error",
    never: "never",
    justNow: "just now",
    minutesAgo: (n) => `${n}m ago`,
    hoursAgo: (n) => `${n}h ago`,
    daysAgo: (n) => `${n}d ago`,
  },
  ru: {
    title: "iCal ссылки",
    description:
      "Все календарные фиды, подключённые к вашим объектам. Нажмите на объект, чтобы открыть его настройки синхронизации.",
    loadFailed: "Не удалось загрузить",
    loading: "Загрузка...",
    empty:
      "Нет подключённых iCal ссылок. Добавьте их в настройках синхронизации каждого объекта.",
    errorBanner: (count) =>
      `Обнаружены ошибки в ${count} ссылках. Откройте объект и проверьте URL.`,
    openSync: "Открыть синхронизацию",
    okBadge: "OK",
    errorBadge: "Ошибка",
    never: "ещё не синхронизировался",
    justNow: "только что",
    minutesAgo: (n) => `${n} мин назад`,
    hoursAgo: (n) => `${n} ч назад`,
    daysAgo: (n) => `${n} д назад`,
  },
  de: {
    title: "iCal-Links",
    description:
      "Alle Kalender-Feeds, die mit Ihren Objekten verbunden sind. Klicken Sie auf ein Objekt, um seine Sync-Einstellungen zu öffnen.",
    loadFailed: "Laden fehlgeschlagen",
    loading: "Wird geladen...",
    empty: "Noch keine iCal-Links verbunden. Fügen Sie sie im Sync-Einstellungs-Tab jedes Objekts hinzu.",
    errorBanner: (count) =>
      `${count} Link${count === 1 ? "" : "s"} mit Fehler. Öffnen Sie das Objekt, um die URL zu prüfen.`,
    openSync: "Sync öffnen",
    okBadge: "OK",
    errorBadge: "Fehler",
    never: "nie",
    justNow: "gerade eben",
    minutesAgo: (n) => `vor ${n} Min.`,
    hoursAgo: (n) => `vor ${n} Std.`,
    daysAgo: (n) => `vor ${n} T.`,
  },
  fr: {
    title: "Liens iCal",
    description:
      "Tous les feeds de calendrier connectés à vos logements. Cliquez sur un logement pour ouvrir ses paramètres Sync.",
    loadFailed: "Échec du chargement",
    loading: "Chargement...",
    empty: "Aucun lien iCal connecté pour l'instant. Ajoutez-les dans l'onglet Sync de chaque logement.",
    errorBanner: (count) =>
      `${count} lien${count === 1 ? "" : "s"} en erreur. Ouvrez le logement pour vérifier l'URL.`,
    openSync: "Ouvrir Sync",
    okBadge: "OK",
    errorBadge: "Erreur",
    never: "jamais",
    justNow: "à l'instant",
    minutesAgo: (n) => `il y a ${n} min`,
    hoursAgo: (n) => `il y a ${n} h`,
    daysAgo: (n) => `il y a ${n} j`,
  },
};

// RT-25.9 tick 16 — iCal links sub-route at
// /dashboard/admin/integrations/ical-links. First admin-shell surface
// that aggregates a per-property thing across the whole account: lists
// every CalendarLink the user can manage (own + managed properties),
// with platform colour, status (OK / error), and last-fetched-at. Lets
// hosts who run several properties spot a broken sync without clicking
// into each property's Sync tab one by one. Reuses the existing
// /api/calendar/links GET (with no propertyId, returns all accessible).
// Available to any logged-in user (cleaners are bounced at the shell);
// no superadmin gating since the data is the user's own.

const FALLBACK_PLATFORM_COLOR = "#6b7280";

// Inline platform presets — mirrors dashboard.tsx and reports-panel.tsx
// to avoid pulling @/lib/platforms (which drags prisma) into the
// client bundle. Keep in sync.
const PLATFORM_PRESETS: ReadonlyArray<{ slug: string; displayName: string; color: string }> = [
  { slug: "airbnb", displayName: "Airbnb", color: "#FF385C" },
  { slug: "booking", displayName: "Booking.com", color: "#003580" },
  { slug: "vrbo", displayName: "Vrbo", color: "#245ABC" },
  { slug: "expedia", displayName: "Expedia", color: "#FFC72C" },
  { slug: "hostaway", displayName: "Hostaway", color: "#2E5BFF" },
  { slug: "lodgify", displayName: "Lodgify", color: "#00B5AD" },
  { slug: "hospitable", displayName: "Hospitable", color: "#1B5E20" },
  { slug: "smoobu", displayName: "Smoobu", color: "#4A148C" },
  { slug: "houfy", displayName: "Houfy", color: "#D84315" },
  { slug: "plumguide", displayName: "Plum Guide", color: "#2E1065" },
  { slug: "whimstay", displayName: "Whimstay", color: "#FF7043" },
  { slug: "direct", displayName: "Direct", color: FALLBACK_PLATFORM_COLOR },
];
const PRESET_BY_SLUG = new Map(PLATFORM_PRESETS.map((p) => [p.slug, p]));
const platformColor = (slug: string) => PRESET_BY_SLUG.get(slug)?.color ?? FALLBACK_PLATFORM_COLOR;
const platformDisplayName = (slug: string) => PRESET_BY_SLUG.get(slug)?.displayName ?? slug;

interface CalendarLinkRow {
  id: number;
  propertyId: number;
  platform: string;
  icalExportUrl: string;
  lastFetchedAt: string | null;
  lastError: string | null;
  failureCount: number;
  property: { id: number; name: string };
}

export default function AdminIcalLinksPage() {
  const { locale } = useI18n();
  const c = COPY[locale];
  const [rows, setRows] = useState<CalendarLinkRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/calendar/links")
      .then((r) => (r.ok ? (r.json() as Promise<CalendarLinkRow[]>) : null))
      .then((data) => {
        if (Array.isArray(data)) setRows(data);
        else setError(c.loadFailed);
      })
      .catch(() => setError(c.loadFailed))
      .finally(() => setLoaded(true));
  }, [c.loadFailed]);

  // Group by property so the table reads as "this property has these
  // feeds" rather than a flat list — for accounts with 5+ properties
  // the property-grouped layout scans much faster.
  const grouped = useMemo(() => {
    const m = new Map<number, { property: { id: number; name: string }; links: CalendarLinkRow[] }>();
    for (const r of rows) {
      const entry = m.get(r.propertyId) ?? { property: r.property, links: [] };
      entry.links.push(r);
      m.set(r.propertyId, entry);
    }
    return Array.from(m.values()).sort((a, b) => a.property.name.localeCompare(b.property.name));
  }, [rows]);

  const errorCount = rows.filter((r) => r.lastError).length;

  const formatRelative = (iso: string | null): string => {
    if (!iso) return c.never;
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMin = Math.floor((now - then) / 60000);
    if (diffMin < 1) return c.justNow;
    if (diffMin < 60) return c.minutesAgo(diffMin);
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return c.hoursAgo(diffHr);
    const diffDay = Math.floor(diffHr / 24);
    return c.daysAgo(diffDay);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {c.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {c.description}
        </p>
      </div>

      {!loaded ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-4)]">
          {c.loading}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-5 text-sm text-rose-300">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {c.empty}
        </div>
      ) : (
        <>
          {errorCount > 0 && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-200">
              {c.errorBanner(errorCount)}
            </div>
          )}
          <div className="space-y-4">
            {grouped.map((g) => (
              <div
                key={g.property.id}
                className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-2)]"
              >
                <Link
                  href={`/dashboard?property=${g.property.id}&view=sync`}
                  className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg-3)]/40 px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--bg-3)]"
                >
                  <span>{g.property.name}</span>
                  <span className="flex items-center gap-1 text-xs text-[var(--ink-4)]">
                    {c.openSync}
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                </Link>
                <ul className="divide-y divide-[var(--line)]/50">
                  {g.links.map((link) => {
                    const ok = !link.lastError;
                    return (
                      <li key={link.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: platformColor(link.platform) }}
                          aria-hidden="true"
                        />
                        <span className="w-32 shrink-0 text-[var(--ink-2)]">
                          {platformDisplayName(link.platform)}
                        </span>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            ok
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-rose-500/15 text-rose-300"
                          }`}
                        >
                          {ok ? c.okBadge : c.errorBadge}
                        </span>
                        <span
                          className="min-w-0 flex-1 truncate text-xs text-[var(--ink-4)]"
                          title={link.lastError ?? link.icalExportUrl}
                        >
                          {link.lastError ?? link.icalExportUrl}
                        </span>
                        <span className="shrink-0 text-xs text-[var(--ink-4)]">
                          {formatRelative(link.lastFetchedAt)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
