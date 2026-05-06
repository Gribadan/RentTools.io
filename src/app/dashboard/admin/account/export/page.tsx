"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";

// RT-25.9 tick 10 — Data export sub-route at
// /dashboard/admin/account/export. Lifts the "Admin · Data export"
// section out of admin-panel.tsx (lines ~2451-2464) into its own
// deep-linkable surface. Uses the existing /api/admin/export-my-data
// endpoint, no API changes. SettingsPanel still keeps its copy until
// the removal sweep ships, matching ticks 4, 5, 9.

export default function AdminExportPage() {
  const { locale } = useI18n();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const exportData = async () => {
    setExporting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/export-my-data");
      if (!res.ok) {
        setError(
          locale === "ru"
            ? "Не удалось подготовить экспорт"
            : "Could not prepare export"
        );
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rent-tool-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {locale === "ru" ? "Экспорт данных" : "Data export"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Скачайте JSON-дамп ваших объектов, бронирований, гостей, iCal ссылок, шаблонов сообщений и записей уборки. Полезно как личная резервная копия."
            : "Download a JSON dump of your own properties, reservations, guests, calendar links, message templates, and cleaning records. Useful as a personal backup."}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5">
        <button
          type="button"
          onClick={exportData}
          disabled={exporting}
          className="h-10 rounded-md bg-[var(--m-accent)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-60"
        >
          {exporting
            ? locale === "ru"
              ? "Готовим..."
              : "Preparing..."
            : locale === "ru"
            ? "Скачать JSON"
            : "Download JSON"}
        </button>
        {error && (
          <p className="mt-3 text-xs text-rose-300">{error}</p>
        )}
      </div>
    </div>
  );
}
