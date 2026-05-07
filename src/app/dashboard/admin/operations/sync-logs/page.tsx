"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

// RT-25.9 tick 17 — Sync logs sub-route at
// /dashboard/admin/operations/sync-logs. Aggregates across all the
// user's accessible properties so they can scan recent sync runs in
// one chronological feed instead of opening each property's Sync tab.
// Reuses GET /api/calendar/sync (no propertyId) which already scopes
// to the user's accessible property set + includes global (propertyId
// null) entries. Pulls /api/properties separately to map propertyId
// to property name for display — same approach the dashboard uses, no
// API change required.
//
// Available to any logged-in user (cleaners are bounced at the shell);
// no superadmin gating since the data is the user's own.

interface SyncLogRow {
  id: number;
  propertyId: number | null;
  level: string;
  message: string;
  createdAt: string;
}

interface SyncResponse {
  logs?: SyncLogRow[];
}

interface PropertyRow {
  id: number;
  name: string;
}

type LevelFilter = "all" | "issues";

interface CopyShape {
  failedToLoad: string;
  dateLocale: string;
  title: string;
  subtitle: string;
  all: string;
  issuesOnly: string;
  loading: string;
  noIssues: string;
  noEntries: string;
  global: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    failedToLoad: "Failed to load",
    dateLocale: "en-GB",
    title: "Sync logs",
    subtitle: "Chronological feed of sync events across all your properties. Last 200 entries.",
    all: "All",
    issuesOnly: "Issues only",
    loading: "Loading...",
    noIssues: "No issues — every sync completed cleanly.",
    noEntries: "No log entries yet. They'll appear after the first sync run.",
    global: "global",
  },
  ru: {
    failedToLoad: "Не удалось загрузить",
    dateLocale: "ru-RU",
    title: "Логи синхронизации",
    subtitle: "Хронологическая лента событий синхронизации по всем вашим объектам. Последние 200 записей.",
    all: "Все",
    issuesOnly: "Только проблемы",
    loading: "Загрузка...",
    noIssues: "Проблем нет — все синхронизации проходят успешно.",
    noEntries: "Записей пока нет. Они появятся после первой синхронизации.",
    global: "глобально",
  },
  de: {
    failedToLoad: "Laden fehlgeschlagen",
    dateLocale: "de-DE",
    title: "Sync-Logs",
    subtitle: "Chronologischer Feed der Sync-Ereignisse über alle Ihre Objekte. Letzte 200 Einträge.",
    all: "Alle",
    issuesOnly: "Nur Probleme",
    loading: "Wird geladen...",
    noIssues: "Keine Probleme — jeder Sync ist sauber durchgelaufen.",
    noEntries: "Noch keine Log-Einträge. Sie erscheinen nach dem ersten Sync-Lauf.",
    global: "global",
  },
  fr: {
    failedToLoad: "Échec du chargement",
    dateLocale: "fr-FR",
    title: "Logs de sync",
    subtitle: "Feed chronologique des événements de sync sur tous vos logements. Dernières 200 entrées.",
    all: "Tout",
    issuesOnly: "Problèmes uniquement",
    loading: "Chargement...",
    noIssues: "Aucun problème — toutes les synchronisations se sont déroulées proprement.",
    noEntries: "Aucune entrée pour l'instant. Elles apparaîtront après le premier sync.",
    global: "global",
  },
  es: {
    failedToLoad: "Error al cargar",
    dateLocale: "es-ES",
    title: "Logs de sync",
    subtitle: "Feed cronológico de eventos de sync en todos sus alojamientos. Últimas 200 entradas.",
    all: "Todos",
    issuesOnly: "Solo incidencias",
    loading: "Cargando...",
    noIssues: "Sin incidencias: todas las sincronizaciones se completaron sin problemas.",
    noEntries: "Aún no hay entradas. Aparecerán tras el primer sync.",
    global: "global",
  },
};

export default function AdminSyncLogsPage() {
  const { locale } = useI18n();
  const t = COPY[locale];
  const [logs, setLogs] = useState<SyncLogRow[]>([]);
  const [props, setProps] = useState<PropertyRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LevelFilter>("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/calendar/sync?limit=200").then((r) =>
        r.ok ? (r.json() as Promise<SyncResponse>) : null
      ),
      fetch("/api/properties").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([syncData, propsData]) => {
        if (syncData && Array.isArray(syncData.logs)) setLogs(syncData.logs);
        // /api/properties without page/limit returns the full array (see
        // src/app/api/properties/route.ts:35).
        if (Array.isArray(propsData)) {
          setProps(propsData.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name })));
        }
      })
      .catch(() => setError(t.failedToLoad))
      .finally(() => setLoaded(true));
  }, [t.failedToLoad]);

  const propNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of props) m.set(p.id, p.name);
    return m;
  }, [props]);

  const visible = useMemo(() => {
    if (filter === "all") return logs;
    return logs.filter((l) => l.level === "warn" || l.level === "error");
  }, [logs, filter]);

  const errorCount = logs.filter((l) => l.level === "error").length;
  const warnCount = logs.filter((l) => l.level === "warn").length;

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(t.dateLocale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Match the dot+pill colour conventions used in the audit page.
  const levelTone = (lvl: string): { dot: string; chip: string } => {
    if (lvl === "error") return { dot: "bg-rose-400", chip: "bg-rose-500/15 text-rose-300" };
    if (lvl === "warn") return { dot: "bg-amber-400", chip: "bg-amber-500/15 text-amber-300" };
    if (lvl === "success") return { dot: "bg-emerald-400", chip: "bg-emerald-500/15 text-emerald-300" };
    return { dot: "bg-sky-400", chip: "bg-sky-400/15 text-sky-300" };
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {t.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {t.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-[var(--bg-3)] text-[var(--ink)]"
              : "text-[var(--ink-3)] hover:bg-[var(--bg-3)]/60"
          }`}
        >
          {t.all}
          <span className="ml-1 text-[var(--ink-4)]">({logs.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("issues")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "issues"
              ? "bg-[var(--bg-3)] text-[var(--ink)]"
              : "text-[var(--ink-3)] hover:bg-[var(--bg-3)]/60"
          }`}
        >
          {t.issuesOnly}
          <span className="ml-1 text-[var(--ink-4)]">({errorCount + warnCount})</span>
        </button>
      </div>

      {!loaded ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-4)]">
          {t.loading}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-5 text-sm text-rose-300">
          {error}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {filter === "issues" ? t.noIssues : t.noEntries}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-2)]">
          <ul className="divide-y divide-[var(--line)]/50">
            {visible.map((log) => {
              const tone = levelTone(log.level);
              const propName = log.propertyId !== null ? propNameById.get(log.propertyId) : null;
              return (
                <li key={log.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone.chip}`}
                  >
                    {log.level}
                  </span>
                  {log.propertyId !== null ? (
                    <Link
                      href={`/dashboard?property=${log.propertyId}&view=sync`}
                      className="shrink-0 text-xs text-[var(--ink-3)] hover:text-[var(--ink)] hover:underline"
                    >
                      {propName ?? `#${log.propertyId}`}
                    </Link>
                  ) : (
                    <span className="shrink-0 text-xs text-[var(--ink-4)]">
                      {t.global}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-[var(--ink-2)]" title={log.message}>
                    {log.message}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--ink-4)]">{formatTime(log.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
