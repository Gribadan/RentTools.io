"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

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

export default function AdminMessageTemplatesPage() {
  const { locale } = useI18n();
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
      .catch(() =>
        setError(locale === "ru" ? "Не удалось загрузить" : "Failed to load"),
      )
      .finally(() => setLoaded(true));
  }, [locale]);

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
    if (days === 0) return locale === "ru" ? "в день заезда" : "on check-in day";
    if (days < 0) {
      const n = Math.abs(days);
      return locale === "ru" ? `за ${n} дн до заезда` : `${n}d before check-in`;
    }
    return locale === "ru" ? `через ${days} дн после заезда` : `${days}d after check-in`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {locale === "ru" ? "Шаблоны сообщений" : "Message templates"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Все шаблоны сообщений по объектам. Нажмите на объект, чтобы открыть настройки синхронизации, где шаблоны редактируются."
            : "All message templates across your properties. Click a property to open its Sync settings, where templates are edited."}
        </p>
      </div>

      {!loaded ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-4)]">
          {locale === "ru" ? "Загрузка..." : "Loading..."}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-5 text-sm text-rose-300">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {locale === "ru"
            ? "Шаблоны сообщений ещё не созданы. Откройте объект и добавьте их во вкладке настроек синхронизации."
            : "No templates yet. Open a property and add them on its Sync settings tab."}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-3 text-sm text-[var(--ink-3)]">
            {locale === "ru"
              ? `${totalCount} шаблон(ов) в ${propertyCount} объект(ах).`
              : `${totalCount} template${totalCount === 1 ? "" : "s"} across ${propertyCount} propert${
                  propertyCount === 1 ? "y" : "ies"
                }.`}
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
                    {locale === "ru" ? "Открыть синхронизацию" : "Open Sync"}
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
