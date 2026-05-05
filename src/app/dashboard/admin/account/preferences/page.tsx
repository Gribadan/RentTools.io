"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useI18n } from "@/lib/i18n/context";

// RT-25.9 tick 3 — Language & theme sub-route. Wraps the existing
// ThemeToggle + LocaleSwitcher components in a labelled card layout
// instead of duplicating their logic.

export default function AdminPreferencesPage() {
  const { locale } = useI18n();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {locale === "ru" ? "Язык и тема" : "Language & theme"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Эти настройки сохраняются в браузере — на других устройствах их нужно выбрать заново."
            : "Saved per-browser — pick again on other devices."}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <h3 className="text-sm font-medium text-[var(--ink)]">
              {locale === "ru" ? "Тема оформления" : "Theme"}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--ink-4)]">
              {locale === "ru" ? "Светлая или тёмная." : "Light or dark."}
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="text-sm font-medium text-[var(--ink)]">
              {locale === "ru" ? "Язык интерфейса" : "Interface language"}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--ink-4)]">
              {locale === "ru" ? "Английский или русский." : "English or Russian."}
            </p>
          </div>
          <LocaleSwitcher />
        </div>
      </div>
    </div>
  );
}
