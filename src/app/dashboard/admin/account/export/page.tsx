"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

// RT-25.9 tick 10 — Data export sub-route at
// /dashboard/admin/account/export. Lifts the "Admin · Data export"
// section out of admin-panel.tsx (lines ~2451-2464) into its own
// deep-linkable surface. Uses the existing /api/admin/export-my-data
// endpoint, no API changes. SettingsPanel still keeps its copy until
// the removal sweep ships, matching ticks 4, 5, 9.

interface CopyShape {
  failedToPrepare: string;
  title: string;
  subtitle: string;
  preparing: string;
  download: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    failedToPrepare: "Could not prepare export",
    title: "Data export",
    subtitle: "Download a JSON dump of your own properties, reservations, guests, calendar links, message templates, and cleaning records. Useful as a personal backup.",
    preparing: "Preparing...",
    download: "Download JSON",
  },
  ru: {
    failedToPrepare: "Не удалось подготовить экспорт",
    title: "Экспорт данных",
    subtitle: "Скачайте JSON-дамп ваших объектов, бронирований, гостей, iCal ссылок, шаблонов сообщений и записей уборки. Полезно как личная резервная копия.",
    preparing: "Готовим...",
    download: "Скачать JSON",
  },
  de: {
    failedToPrepare: "Export konnte nicht vorbereitet werden",
    title: "Datenexport",
    subtitle: "Laden Sie einen JSON-Dump Ihrer Objekte, Buchungen, Gäste, iCal-Links, Nachrichtenvorlagen und Reinigungseinträge herunter. Nützlich als persönliches Backup.",
    preparing: "Wird vorbereitet...",
    download: "JSON herunterladen",
  },
};

export default function AdminExportPage() {
  const { locale } = useI18n();
  const t = COPY[locale];
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const exportData = async () => {
    setExporting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/export-my-data");
      if (!res.ok) {
        setError(t.failedToPrepare);
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
          {t.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {t.subtitle}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5">
        <button
          type="button"
          onClick={exportData}
          disabled={exporting}
          className="h-10 rounded-md bg-[var(--m-accent)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-60"
        >
          {exporting ? t.preparing : t.download}
        </button>
        {error && (
          <p className="mt-3 text-xs text-rose-300">{error}</p>
        )}
      </div>
    </div>
  );
}
