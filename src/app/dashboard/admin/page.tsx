"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

// RT-25.9 tick 6 — admin home upgrade. Replaces the tick-1 placeholder
// with (a) a tile grid of the migrated sub-routes so the admin shell
// has a useful landing surface, and (b) a "Recent activity" strip
// pulling the last 5 entries from /api/audit so the operator notices
// what changed since they last logged in. The audit endpoint is
// per-user (not a global feed); when the cross-user admin audit-log
// endpoint exists, this strip can be swapped in place.

interface AuditEntry {
  id: number;
  action: string;
  resourceType: string;
  resourceId: number;
  createdAt: string;
}

interface AuditResponse {
  entries?: AuditEntry[];
}

interface MeResponse {
  user?: { role: string } | null;
}

interface Tile {
  href: string;
  label: { en: string; ru: string };
  desc: { en: string; ru: string };
  // RT-25.9 tick 15 — match the sidebar gating in layout.tsx so the
  // admin home only surfaces tiles whose underlying API the user can
  // actually call.
  requiresSuperadmin?: boolean;
}

const TILES: ReadonlyArray<{
  group: { en: string; ru: string };
  items: ReadonlyArray<Tile>;
}> = [
  {
    group: { en: "Account", ru: "Аккаунт" },
    items: [
      {
        href: "/dashboard/admin/account/profile",
        label: { en: "Profile", ru: "Профиль" },
        desc: { en: "Username, password, sessions.", ru: "Логин, пароль, сессии." },
      },
      {
        href: "/dashboard/admin/account/preferences",
        label: { en: "Language & theme", ru: "Язык и тема" },
        desc: { en: "Per-browser display preferences.", ru: "Настройки отображения в этом браузере." },
      },
      {
        href: "/dashboard/admin/account/export",
        label: { en: "Data export", ru: "Экспорт данных" },
        desc: { en: "Download a JSON backup of your data.", ru: "Скачать JSON резервную копию данных." },
      },
    ],
  },
  {
    group: { en: "Workspace", ru: "Рабочее пространство" },
    items: [
      {
        href: "/dashboard/admin/workspace/users",
        label: { en: "Users & roles", ru: "Пользователи и роли" },
        desc: { en: "Admins and managers of this instance.", ru: "Администраторы и менеджеры." },
      },
      {
        href: "/dashboard/admin/workspace/properties",
        label: { en: "Properties", ru: "Объекты" },
        desc: {
          en: "Key-settings summary across every accessible property.",
          ru: "Сводка ключевых настроек по всем доступным объектам.",
        },
      },
      {
        href: "/dashboard/admin/workspace/site-settings",
        label: { en: "Site settings", ru: "Настройки сайта" },
        desc: { en: "Public signup, quotas, landing announcement.", ru: "Регистрация, квоты, объявление." },
        requiresSuperadmin: true,
      },
      {
        href: "/dashboard/admin/workspace/audit",
        label: { en: "Audit log", ru: "Журнал действий" },
        desc: { en: "Recent actions tied to your session.", ru: "Последние действия в вашей сессии." },
      },
    ],
  },
  {
    group: { en: "Integrations", ru: "Интеграции" },
    items: [
      {
        href: "/dashboard/admin/integrations/ical-links",
        label: { en: "iCal links", ru: "iCal ссылки" },
        desc: {
          en: "All calendar feeds across your properties — status + last sync.",
          ru: "Все календарные фиды по объектам — статус и время последней синхронизации.",
        },
      },
      {
        href: "/dashboard/admin/integrations/feed-tokens",
        label: { en: "Feed access tokens", ru: "Токены доступа к фиду" },
        desc: {
          en: "Per-property: public or token-gated iCal feed URL.",
          ru: "По объектам: публичный или закрытый токеном URL фида.",
        },
      },
      {
        href: "/dashboard/admin/integrations/gemini",
        label: { en: "Gemini AI key", ru: "Gemini AI ключ" },
        desc: { en: "API key for guest passport extraction.", ru: "API ключ для извлечения паспортов." },
      },
      {
        href: "/dashboard/admin/integrations/seo",
        label: { en: "SEO overrides", ru: "SEO переопределения" },
        desc: {
          en: "Override title, description, OG image, canonical per page.",
          ru: "Переопределить title, description, OG-картинку и canonical для страницы.",
        },
        requiresSuperadmin: true,
      },
      {
        href: "/dashboard/admin/integrations/platforms",
        label: { en: "Calendar platforms", ru: "Платформы (календарь)" },
        desc: {
          en: "Edit colors, sort order, enable/disable. Add custom platforms.",
          ru: "Цвета, порядок, включение/отключение. Добавить пользовательские платформы.",
        },
        requiresSuperadmin: true,
      },
    ],
  },
  {
    group: { en: "Operations", ru: "Эксплуатация" },
    items: [
      {
        href: "/dashboard/admin/operations/sync-logs",
        label: { en: "Sync logs", ru: "Логи синхронизации" },
        desc: {
          en: "Chronological feed of sync events across all properties.",
          ru: "Хронологическая лента событий синхронизации по всем объектам.",
        },
      },
      {
        href: "/dashboard/admin/operations/status",
        label: { en: "Status page", ru: "Статус" },
        desc: { en: "Internal health endpoints for spot checks.", ru: "Внутренние эндпоинты здоровья для проверки." },
      },
    ],
  },
  {
    group: { en: "Content", ru: "Контент" },
    items: [
      {
        href: "/dashboard/admin/content/blog-media",
        label: { en: "Blog media", ru: "Медиа блога" },
        desc: {
          en: "OG images referenced by blog posts. Read-only until R2 / S3 ships.",
          ru: "OG-картинки статей блога. Только просмотр, пока не подключено R2 / S3.",
        },
        requiresSuperadmin: true,
      },
    ],
  },
];

export default function AdminHomePage() {
  const { locale } = useI18n();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? (r.json() as Promise<MeResponse>) : null))
      .then((data) => setRole(data?.user?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => (r.ok ? (r.json() as Promise<AuditResponse>) : null))
      .then((data) => {
        const rows = Array.isArray(data?.entries) ? data!.entries! : [];
        setEntries(rows.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setAuditLoaded(true));
  }, []);

  const isSuperadmin = role === "superadmin";
  const visibleTiles = TILES.map((group) => ({
    ...group,
    items: group.items.filter((t) => isSuperadmin || !t.requiresSuperadmin),
  })).filter((group) => group.items.length > 0);

  const formatRelative = (iso: string): string => {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMin = Math.floor((now - then) / 60000);
    if (diffMin < 1) return locale === "ru" ? "только что" : "just now";
    if (diffMin < 60) return locale === "ru" ? `${diffMin} мин назад` : `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return locale === "ru" ? `${diffHr} ч назад` : `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return locale === "ru" ? `${diffDay} д назад` : `${diffDay}d ago`;
    return new Date(iso).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {locale === "ru" ? "Администрирование" : "Admin"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Все настройки в одном месте. Разделы появляются по мере переноса со старой страницы настроек."
            : "Consolidated settings home. More sections light up as they migrate from the legacy long-scroll settings page."}
        </p>
      </div>

      {/* Tile grid */}
      {visibleTiles.map((group) => (
        <section key={group.group.en} className="space-y-3">
          <h3 className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
            {locale === "ru" ? group.group.ru : group.group.en}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4 transition-all hover:border-[var(--line-2)] hover:bg-[var(--bg-3)]"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[var(--ink)]">
                    {locale === "ru" ? item.label.ru : item.label.en}
                  </h4>
                  <svg className="h-4 w-4 text-[var(--ink-4)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
                <p className="mt-1.5 text-xs text-[var(--ink-4)]">
                  {locale === "ru" ? item.desc.ru : item.desc.en}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* Recent activity strip */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
          {locale === "ru" ? "Последние действия" : "Recent activity"}
        </h3>
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-2)]">
          {!auditLoaded ? (
            <div className="px-4 py-5 text-sm text-[var(--ink-4)]">
              {locale === "ru" ? "Загрузка..." : "Loading..."}
            </div>
          ) : entries.length === 0 ? (
            <div className="px-4 py-5 text-sm text-[var(--ink-4)]">
              {locale === "ru" ? "Действий пока нет." : "No activity yet."}
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line)]/50">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="inline-flex shrink-0 rounded bg-[var(--bg-3)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-3)]">
                    {e.action}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[var(--ink-2)]">
                    {e.resourceType}
                    <span className="text-[var(--ink-4)]"> #{e.resourceId}</span>
                  </span>
                  <span className="shrink-0 text-xs text-[var(--ink-4)]">
                    {formatRelative(e.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
