"use client";

import { useI18n } from "@/lib/i18n/context";

// RT-25.9 tick 1 — admin home placeholder. Subsequent ticks will:
//   - migrate ProfilePanel into /dashboard/admin/account/profile
//   - migrate AdminPanel sub-sections into Workspace + Operations groups
//   - wire the "what's new" audit-log strip described in the task body
// For now this page communicates that the shell is in progress so a
// curious user who lands here doesn't think the app is broken.

export default function AdminHomePage() {
  const { locale } = useI18n();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {locale === "ru" ? "Администрирование" : "Admin"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Новый раздел собирает все настройки в одном месте. Разделы появляются по мере готовности."
            : "Consolidated settings home. Sections light up as they migrate from the long-scroll settings page."}
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-2)] p-8 text-center">
        <p className="text-sm text-[var(--ink-3)]">
          {locale === "ru"
            ? "Большинство страниц пока в старом разделе \"Настройки\". Перенос идёт постепенно."
            : "Most sections still live under the legacy Settings panel. Migration is in progress — this shell will replace it."}
        </p>
      </div>
    </div>
  );
}
