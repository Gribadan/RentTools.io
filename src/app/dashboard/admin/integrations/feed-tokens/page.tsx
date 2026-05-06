"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

// RT-25.9 tick 18 — Feed access tokens sub-route at
// /dashboard/admin/integrations/feed-tokens. Same aggregation pattern
// as ticks 16 + 17: gives owners of multiple properties a single
// surface to see which ones expose a public feed URL vs which ones
// have a token set (private). Token rotation itself stays inside the
// per-property Sync settings tab — this page is a read-only overview
// with deep links into the rotation UI.
//
// Reuses GET /api/properties (no page/limit returns the full array
// with all scalar fields including feedToken) — no API change.

interface PropertyRow {
  id: number;
  name: string;
  feedToken: string | null;
}

export default function AdminFeedTokensPage() {
  const { locale } = useI18n();
  const [props, setProps] = useState<PropertyRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          setProps(
            data.map((p: { id: number; name: string; feedToken: string | null }) => ({
              id: p.id,
              name: p.name,
              feedToken: p.feedToken,
            }))
          );
        } else {
          setError(locale === "ru" ? "Не удалось загрузить" : "Failed to load");
        }
      })
      .catch(() => setError(locale === "ru" ? "Не удалось загрузить" : "Failed to load"))
      .finally(() => setLoaded(true));
  }, [locale]);

  const sorted = useMemo(
    () => [...props].sort((a, b) => a.name.localeCompare(b.name)),
    [props]
  );
  const publicCount = props.filter((p) => !p.feedToken).length;
  const gatedCount = props.length - publicCount;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {locale === "ru" ? "Токены доступа к фиду" : "Feed access tokens"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "У каждого объекта есть iCal-фид с объединённым календарём. Без токена URL публичный — любой, у кого есть ссылка, может его прочитать. С токеном URL становится приватным. Обзор статусов; ротация токена выполняется на странице синхронизации объекта."
            : "Each property exposes a combined iCal feed URL. Without a token the URL is public — anyone with the link can read it. With a token set, the URL becomes private. Overview of statuses; token rotation lives on each property's Sync settings tab."}
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
      ) : props.length === 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {locale === "ru"
            ? "У вас пока нет объектов. Добавьте объект, чтобы получить iCal-фид."
            : "No properties yet. Add a property to get its iCal feed URL."}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 text-xs text-[var(--ink-3)]">
            <span>
              {locale === "ru" ? "Публичный фид: " : "Public feed: "}
              <span className="text-[var(--ink)]">{publicCount}</span>
            </span>
            <span>
              {locale === "ru" ? "Закрыт токеном: " : "Token set: "}
              <span className="text-[var(--ink)]">{gatedCount}</span>
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-2)]">
            <ul className="divide-y divide-[var(--line)]/50">
              {sorted.map((p) => {
                const gated = !!p.feedToken;
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="min-w-0 flex-1 truncate text-[var(--ink)]">{p.name}</span>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        gated
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {gated
                        ? locale === "ru"
                          ? "Закрыт"
                          : "Token set"
                        : locale === "ru"
                        ? "Публичный"
                        : "Public"}
                    </span>
                    <Link
                      href={`/dashboard?property=${p.id}&view=sync`}
                      className="shrink-0 text-xs text-[var(--ink-3)] hover:text-[var(--ink)] hover:underline"
                    >
                      {locale === "ru" ? "Открыть синхронизацию →" : "Open Sync →"}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
