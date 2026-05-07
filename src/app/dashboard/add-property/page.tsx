"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface PlatformRow {
  platform: "airbnb" | "booking";
  label: string;
  color: string;
  placeholder: string;
  url: string;
}

interface CopyShape {
  nameRequired: string;
  backToDashboard: string;
  addProperty: string;
  propertyName: string;
  propertyNameHint: string;
  propertyNamePlaceholder: string;
  calendarFeeds: string;
  calendarFeedsHint: string;
  icalExportUrl: string;
  cancel: string;
  creating: string;
  add: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    nameRequired: "Property name is required",
    backToDashboard: "Back to dashboard",
    addProperty: "Add property",
    propertyName: "Property name",
    propertyNameHint: "Visible only to you — guests don't see this.",
    propertyNamePlaceholder: "Sunset Cottage",
    calendarFeeds: "Calendar feeds",
    calendarFeedsHint: "Optional — you can add these later from the property settings page. Airbnb and Booking.com are supported.",
    icalExportUrl: "iCal export URL",
    cancel: "Cancel",
    creating: "Creating…",
    add: "Add property",
  },
  ru: {
    nameRequired: "Введите название объекта",
    backToDashboard: "Назад в кабинет",
    addProperty: "Добавить объект",
    propertyName: "Название объекта",
    propertyNameHint: "Видно только вам — гостям не показываем.",
    propertyNamePlaceholder: "Квартира на Невском",
    calendarFeeds: "Календари с площадок",
    calendarFeedsHint: "Можно пропустить и добавить позже на странице объекта. Поддерживаются Airbnb и Booking.com.",
    icalExportUrl: "iCal Export URL",
    cancel: "Отмена",
    creating: "Создаю…",
    add: "Добавить объект",
  },
  de: {
    nameRequired: "Objektname ist erforderlich",
    backToDashboard: "Zurück zum Dashboard",
    addProperty: "Objekt hinzufügen",
    propertyName: "Objektname",
    propertyNameHint: "Nur für Sie sichtbar — Gäste sehen ihn nicht.",
    propertyNamePlaceholder: "Sonnenuntergang-Wohnung",
    calendarFeeds: "Kalender-Feeds",
    calendarFeedsHint: "Optional — Sie können sie später auf der Objektseite hinzufügen. Airbnb und Booking.com werden unterstützt.",
    icalExportUrl: "iCal-Export-URL",
    cancel: "Abbrechen",
    creating: "Wird erstellt…",
    add: "Objekt hinzufügen",
  },
};

function AddPropertyContent() {
  const { locale } = useI18n();
  const t = COPY[locale];
  const router = useRouter();
  const [name, setName] = useState("");
  const [rows, setRows] = useState<PlatformRow[]>([
    { platform: "airbnb", label: "Airbnb", color: "#ff385c", placeholder: "https://www.airbnb.com/calendar/ical/…", url: "" },
    { platform: "booking", label: "Booking.com", color: "#003580", placeholder: "https://admin.booking.com/…/ical.html?…", url: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const setRowUrl = (i: number, url: string) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, url } : r)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t.nameRequired);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      // Create the property first.
      const propRes = await fetch(`/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!propRes.ok) {
        const data = await propRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create property");
      }
      const property = await propRes.json();

      // Then any iCal links the user filled in. Done sequentially so
      // a 500 on the booking endpoint doesn't leave the airbnb POST
      // half-applied — but in practice this only matters for error
      // reporting; the property is already saved.
      for (const row of rows) {
        if (!row.url.trim()) continue;
        const r = await fetch(`/api/calendar/links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: property.id,
            platform: row.platform,
            icalExportUrl: row.url.trim(),
          }),
        });
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          // Property is already created; surface the link-add failure
          // but don't block the navigation.
          console.warn("Link create failed", row.platform, data);
        }
      }

      // Open the new property in the dashboard, calendar view.
      router.push(`/dashboard?property=${property.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="editorial min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg-2)]">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-6 h-16">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t.backToDashboard}
          </Link>
          <h1 className="text-base font-semibold text-[var(--ink)]">
            {t.addProperty}
          </h1>
          <div className="w-[150px]" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <form onSubmit={submit} className="space-y-8">
          {/* Property name */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--ink)]">
              {t.propertyName}
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-3)]">
              {t.propertyNameHint}
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.propertyNamePlaceholder}
              className="mt-3 h-11 w-full rounded-lg border border-[var(--line-2)] bg-[var(--bg-2)] px-4 text-base text-[var(--ink)] placeholder-[var(--ink-4)] outline-none focus:border-[var(--m-accent)] focus:ring-1 focus:ring-[var(--m-accent)]/20"
            />
          </section>

          {/* iCal feed URLs */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--ink)]">
              {t.calendarFeeds}
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-3)]">
              {t.calendarFeedsHint}
            </p>
            <div className="mt-4 space-y-3">
              {rows.map((row, i) => (
                <div key={row.platform} className="rounded-lg border border-[var(--line-2)] bg-[var(--bg-2)] p-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white"
                      style={{ backgroundColor: row.color }}
                    >
                      {row.label}
                    </span>
                    <span className="text-xs text-[var(--ink-4)]">
                      {t.icalExportUrl}
                    </span>
                  </div>
                  <input
                    value={row.url}
                    onChange={(e) => setRowUrl(i, e.target.value)}
                    placeholder={row.placeholder}
                    className="mt-2 h-10 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] placeholder-[var(--ink-4)] outline-none focus:border-[var(--m-accent)] focus:ring-1 focus:ring-[var(--m-accent)]/20"
                  />
                </div>
              ))}
            </div>
          </section>

          {error && (
            <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--line)]">
            <Link
              href="/dashboard"
              className="rounded-md px-4 py-2 text-sm text-[var(--ink-2)] hover:bg-[var(--bg-3)] transition-colors"
            >
              {t.cancel}
            </Link>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex items-center gap-1.5 rounded-md bg-[var(--m-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-50"
            >
              {submitting ? t.creating : t.add}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function AddPropertyPage() {
  return (
    <AuthGuard>
      {() => <AddPropertyContent />}
    </AuthGuard>
  );
}
