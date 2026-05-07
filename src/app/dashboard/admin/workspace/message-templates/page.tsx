"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

// RT-25.9 tick 25 — Message templates sub-route at
// /dashboard/admin/workspace/message-templates. Cross-property overview
// of every MessageTemplate the user can manage (own + managed
// properties). Same aggregation pattern as ical-links (tick 16) +
// feed-tokens (tick 18) + sync-logs (tick 17): read-only summary in the
// admin shell, edits stay on the per-property Sync settings tab via a
// deep-link. Reuses GET /api/message-templates — extended in this tick
// to accept no propertyId and return all accessible templates with
// property metadata included for grouping. No superadmin gating; data
// is the user's own. Cleaners bounce at the shell.

interface MessageTemplateRow {
  id: number;
  propertyId: number;
  name: string;
  language: string;
  subject: string;
  body: string;
  sendOffsetDays: number;
  createdAt: string;
  property: { id: number; name: string };
}

interface ApiResponse {
  templates?: MessageTemplateRow[];
}

interface CopyShape {
  failedToLoad: string;
  onCheckIn: string;
  beforeCheckIn: (n: number) => string;
  afterCheckIn: (n: number) => string;
  title: string;
  subtitle: string;
  loading: string;
  empty: string;
  summary: (total: number, properties: number) => string;
  openSync: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    failedToLoad: "Failed to load",
    onCheckIn: "on check-in day",
    beforeCheckIn: (n) => `${n}d before check-in`,
    afterCheckIn: (n) => `${n}d after check-in`,
    title: "Message templates",
    subtitle: "All message templates across your properties. Click a property to open its Sync settings, where templates are edited.",
    loading: "Loading...",
    empty: "No templates yet. Open a property and add them on its Sync settings tab.",
    summary: (total, properties) =>
      `${total} template${total === 1 ? "" : "s"} across ${properties} propert${properties === 1 ? "y" : "ies"}.`,
    openSync: "Open Sync",
  },
  ru: {
    failedToLoad: "Не удалось загрузить",
    onCheckIn: "в день заезда",
    beforeCheckIn: (n) => `за ${n} дн до заезда`,
    afterCheckIn: (n) => `через ${n} дн после заезда`,
    title: "Шаблоны сообщений",
    subtitle: "Все шаблоны сообщений по объектам. Нажмите на объект, чтобы открыть настройки синхронизации, где шаблоны редактируются.",
    loading: "Загрузка...",
    empty: "Шаблоны сообщений ещё не созданы. Откройте объект и добавьте их во вкладке настроек синхронизации.",
    summary: (total, properties) => `${total} шаблон(ов) в ${properties} объект(ах).`,
    openSync: "Открыть синхронизацию",
  },
  de: {
    failedToLoad: "Laden fehlgeschlagen",
    onCheckIn: "am Anreisetag",
    beforeCheckIn: (n) => `${n} T. vor Anreise`,
    afterCheckIn: (n) => `${n} T. nach Anreise`,
    title: "Nachrichtenvorlagen",
    subtitle: "Alle Nachrichtenvorlagen Ihrer Objekte. Klicken Sie auf ein Objekt, um die Sync-Einstellungen zu öffnen, in denen die Vorlagen bearbeitet werden.",
    loading: "Wird geladen...",
    empty: "Noch keine Vorlagen. Öffnen Sie ein Objekt und fügen Sie sie im Sync-Einstellungs-Tab hinzu.",
    summary: (total, properties) =>
      `${total} Vorlage${total === 1 ? "" : "n"} über ${properties} Objekt${properties === 1 ? "" : "e"}.`,
    openSync: "Sync öffnen",
  },
  fr: {
    failedToLoad: "Échec du chargement",
    onCheckIn: "le jour de l'arrivée",
    beforeCheckIn: (n) => `${n} j avant l'arrivée`,
    afterCheckIn: (n) => `${n} j après l'arrivée`,
    title: "Modèles de messages",
    subtitle: "Tous les modèles de messages sur vos logements. Cliquez sur un logement pour ouvrir ses paramètres Sync, où les modèles se modifient.",
    loading: "Chargement...",
    empty: "Aucun modèle pour l'instant. Ouvrez un logement et ajoutez-en dans l'onglet Sync.",
    summary: (total, properties) =>
      `${total} modèle${total === 1 ? "" : "s"} sur ${properties} logement${properties === 1 ? "" : "s"}.`,
    openSync: "Ouvrir Sync",
  },
};

export default function AdminMessageTemplatesPage() {
  const { locale } = useI18n();
  const t = COPY[locale];
  const [rows, setRows] = useState<MessageTemplateRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/message-templates")
      .then((r) => (r.ok ? (r.json() as Promise<ApiResponse>) : null))
      .then((data) => {
        const list = Array.isArray(data?.templates) ? data!.templates! : [];
        setRows(list);
      })
      .catch(() => setError(t.failedToLoad))
      .finally(() => setLoaded(true));
  }, [t.failedToLoad]);

  // Group templates by property — mirrors the iCal-links + feed-tokens
  // overview shape so the shell reads consistently across these
  // cross-property surfaces.
  const grouped = useMemo(() => {
    const m = new Map<
      number,
      { property: { id: number; name: string }; templates: MessageTemplateRow[] }
    >();
    for (const r of rows) {
      const entry = m.get(r.propertyId) ?? { property: r.property, templates: [] };
      entry.templates.push(r);
      m.set(r.propertyId, entry);
    }
    return Array.from(m.values()).sort((a, b) =>
      a.property.name.localeCompare(b.property.name),
    );
  }, [rows]);

  const totalCount = rows.length;
  const propertyCount = grouped.length;

  const formatOffset = (days: number): string => {
    if (days === 0) return t.onCheckIn;
    if (days < 0) {
      return t.beforeCheckIn(Math.abs(days));
    }
    return t.afterCheckIn(days);
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

      {!loaded ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-4)]">
          {t.loading}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-5 text-sm text-rose-300">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {t.empty}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-3 text-sm text-[var(--ink-3)]">
            {t.summary(totalCount, propertyCount)}
          </div>
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
                    {t.openSync}
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </span>
                </Link>
                <ul className="divide-y divide-[var(--line)]/50">
                  {g.templates.map((tpl) => (
                    <li
                      key={tpl.id}
                      className="flex items-start gap-3 px-4 py-2.5 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-[var(--ink)]">{tpl.name}</span>
                          <span className="rounded bg-[var(--bg-3)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
                            {tpl.language}
                          </span>
                          <span className="text-[11px] text-[var(--ink-4)]">
                            {formatOffset(tpl.sendOffsetDays)}
                          </span>
                        </div>
                        <div
                          className="mt-0.5 truncate text-xs text-[var(--ink-4)]"
                          title={tpl.subject || tpl.body}
                        >
                          {tpl.subject || tpl.body.slice(0, 120)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
