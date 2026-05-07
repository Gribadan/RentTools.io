"use client";

import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

// RT-25.9 tick 9 — Status page sub-route at
// /dashboard/admin/operations/status. Pulls the "Admin · System status"
// section out of admin-panel.tsx into its own deep-linkable surface.
// The two health endpoints (app + calendar sync) are the same ones the
// legacy AdminPanel surfaced; SettingsPanel still renders its copy
// until the removal sweep ships, matching ticks 4 + 5.
//
// External status.renttools.io URL was dropped in RT-25.1 (commit
// fedf923) because the subdomain never got DNS — when an external
// status page does land, link it here.

interface CopyShape {
  title: string;
  subtitle: string;
  appHealth: string;
  syncHealth: string;
  externalNote: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "System status",
    subtitle: "Internal health endpoints for this instance. Use these to spot-check when sync is misbehaving or a 5xx slipped through.",
    appHealth: "App health",
    syncHealth: "Calendar sync health",
    externalNote: "An external status surface (status.renttools.io) is not yet wired. When it lands it will be linked here.",
  },
  ru: {
    title: "Статус системы",
    subtitle: "Внутренние эндпоинты здоровья инстанса. Используйте для проверки в случае ошибок синхронизации или 5xx.",
    appHealth: "Здоровье приложения",
    syncHealth: "Здоровье календарной синхронизации",
    externalNote: "Внешняя страница статуса (status.renttools.io) пока не настроена. Когда появится — будет ссылаться отсюда.",
  },
};

export default function AdminStatusPage() {
  const { locale } = useI18n();
  const t = COPY[locale];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {t.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {t.subtitle}
        </p>
      </div>

      <div className="space-y-3">
        <a
          href="/api/health"
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4 transition-all hover:border-[var(--line-2)] hover:bg-[var(--bg-3)]"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--ink)]">
              {t.appHealth}
            </h3>
            <svg className="h-4 w-4 text-[var(--ink-4)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </div>
          <p className="mt-1 font-mono text-xs text-[var(--ink-4)]">/api/health</p>
        </a>

        <a
          href="/api/calendar/health"
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4 transition-all hover:border-[var(--line-2)] hover:bg-[var(--bg-3)]"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--ink)]">
              {t.syncHealth}
            </h3>
            <svg className="h-4 w-4 text-[var(--ink-4)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </div>
          <p className="mt-1 font-mono text-xs text-[var(--ink-4)]">/api/calendar/health</p>
        </a>
      </div>

      <p className="text-xs text-[var(--ink-4)]">
        {t.externalNote}
      </p>
    </div>
  );
}
