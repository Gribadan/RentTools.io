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
  publicCountLabel: string;
  gatedCountLabel: string;
  gatedBadge: string;
  publicBadge: string;
  openSync: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "Feed access tokens",
    description:
      "Each property exposes a combined iCal feed URL. Without a token the URL is public — anyone with the link can read it. With a token set, the URL becomes private. Overview of statuses; token rotation lives on each property's Sync settings tab.",
    loadFailed: "Failed to load",
    loading: "Loading...",
    empty: "No properties yet. Add a property to get its iCal feed URL.",
    publicCountLabel: "Public feed: ",
    gatedCountLabel: "Token set: ",
    gatedBadge: "Token set",
    publicBadge: "Public",
    openSync: "Open Sync →",
  },
  ru: {
    title: "Токены доступа к фиду",
    description:
      "У каждого объекта есть iCal-фид с объединённым календарём. Без токена URL публичный — любой, у кого есть ссылка, может его прочитать. С токеном URL становится приватным. Обзор статусов; ротация токена выполняется на странице синхронизации объекта.",
    loadFailed: "Не удалось загрузить",
    loading: "Загрузка...",
    empty: "У вас пока нет объектов. Добавьте объект, чтобы получить iCal-фид.",
    publicCountLabel: "Публичный фид: ",
    gatedCountLabel: "Закрыт токеном: ",
    gatedBadge: "Закрыт",
    publicBadge: "Публичный",
    openSync: "Открыть синхронизацию →",
  },
  de: {
    title: "Feed-Zugriffstoken",
    description:
      "Jedes Objekt stellt eine kombinierte iCal-Feed-URL bereit. Ohne Token ist die URL öffentlich — jeder mit dem Link kann sie lesen. Mit gesetztem Token wird die URL privat. Statusübersicht; die Token-Rotation erfolgt im Sync-Einstellungs-Tab des jeweiligen Objekts.",
    loadFailed: "Laden fehlgeschlagen",
    loading: "Wird geladen...",
    empty: "Noch keine Objekte. Fügen Sie ein Objekt hinzu, um seine iCal-Feed-URL zu erhalten.",
    publicCountLabel: "Öffentlicher Feed: ",
    gatedCountLabel: "Token gesetzt: ",
    gatedBadge: "Token gesetzt",
    publicBadge: "Öffentlich",
    openSync: "Sync öffnen →",
  },
  fr: {
    title: "Tokens d'accès au feed",
    description:
      "Chaque logement expose une URL de feed iCal combinée. Sans token, l'URL est publique — quiconque possède le lien peut la lire. Avec un token défini, l'URL devient privée. Vue d'ensemble des statuts ; la rotation du token se fait dans l'onglet Sync de chaque logement.",
    loadFailed: "Échec du chargement",
    loading: "Chargement...",
    empty: "Aucun logement pour l'instant. Ajoutez un logement pour obtenir son URL de feed iCal.",
    publicCountLabel: "Feed public : ",
    gatedCountLabel: "Token défini : ",
    gatedBadge: "Token défini",
    publicBadge: "Public",
    openSync: "Ouvrir Sync →",
  },
};

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
  const c = COPY[locale];
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
          setError(c.loadFailed);
        }
      })
      .catch(() => setError(c.loadFailed))
      .finally(() => setLoaded(true));
  }, [c.loadFailed]);

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
      ) : props.length === 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {c.empty}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 text-xs text-[var(--ink-3)]">
            <span>
              {c.publicCountLabel}
              <span className="text-[var(--ink)]">{publicCount}</span>
            </span>
            <span>
              {c.gatedCountLabel}
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
                      {gated ? c.gatedBadge : c.publicBadge}
                    </span>
                    <Link
                      href={`/dashboard?property=${p.id}&view=sync`}
                      className="shrink-0 text-xs text-[var(--ink-3)] hover:text-[var(--ink)] hover:underline"
                    >
                      {c.openSync}
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
