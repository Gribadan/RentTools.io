"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CleaningSchedule, type CleaningScheduleHandle } from "@/components/cleaning-schedule";
import { useI18n } from "@/lib/i18n/context";
import type { Property, CalendarLink, DateOverride } from "@/lib/types";

interface CalendarEvent {
  id: number;
  platform: string;
  summary: string;
  startDate: string;
  endDate: string;
}

interface PropertyCleaningViewProps {
  property: Property;
  /** Called after the master cleaning toggle is flipped. Lets the parent
   *  refetch the property record so other tabs (calendar, dashboard)
   *  pick up the new value without a manual refresh. */
  onCleaningEnabledChanged?: () => void;
}

export function PropertyCleaningView({ property, onCleaningEnabledChanged }: PropertyCleaningViewProps) {
  const { t, locale } = useI18n();
  const [syncedEvents, setSyncedEvents] = useState<CalendarEvent[]>([]);
  const [links, setLinks] = useState<CalendarLink[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [cleaningEnabled, setCleaningEnabled] = useState<boolean>(property.cleaningEnabled !== false);
  const [toggling, setToggling] = useState(false);
  const [includePotential, setIncludePotential] = useState(true);
  const [copied, setCopied] = useState(false);
  const scheduleRef = useRef<CleaningScheduleHandle>(null);

  useEffect(() => {
    setCleaningEnabled(property.cleaningEnabled !== false);
  }, [property.cleaningEnabled, property.id]);

  const fetchData = useCallback(async () => {
    const [syncRes, linksRes, ovRes] = await Promise.all([
      fetch(`/api/calendar/sync?propertyId=${property.id}&limit=200`).then(r => r.json()),
      fetch(`/api/calendar/links?propertyId=${property.id}`).then(r => r.json()),
      fetch(`/api/date-overrides?propertyId=${property.id}`).then(r => r.json()),
    ]);
    setSyncedEvents(syncRes.events || []);
    setLinks(linksRes || []);
    setOverrides(ovRes || []);
  }, [property.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (next: boolean) => {
    if (toggling) return;
    setToggling(true);
    setCleaningEnabled(next); // optimistic
    try {
      const res = await fetch(`/api/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cleaningEnabled: next }),
      });
      if (!res.ok) {
        setCleaningEnabled(!next); // rollback
      } else {
        onCleaningEnabledChanged?.();
      }
    } catch {
      setCleaningEnabled(!next); // rollback
    } finally {
      setToggling(false);
    }
  };

  const handleCopy = () => {
    scheduleRef.current?.copy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    scheduleRef.current?.print();
  };

  /* Two-column layout matches PropertyCalendar:
       - Outer escapes <main>'s side padding so the content lines up
         1:1 with the dashboard header at every viewport.
       - Sidebar always renders on lg+ (sticky, lg:top-3 to give the
         header breathing room) so its width contribution to the
         centered column is stable.
  */
  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[1760px] px-3 sm:px-5 flex flex-col lg:flex-row gap-6">
        <div className="min-w-0 lg:flex-1 space-y-3">
          {cleaningEnabled ? (
            <CleaningSchedule
              ref={scheduleRef}
              properties={[property]}
              syncedEvents={{ [property.id]: syncedEvents }}
              links={{ [property.id]: links }}
              overrides={{ [property.id]: overrides }}
              mode="property"
              selectedPropertyId={property.id}
              onOverrideChanged={fetchData}
              hideControls
              includePotential={includePotential}
              onIncludePotentialChange={setIncludePotential}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--line-2)] bg-[var(--bg-2)] p-8 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--line-2)]/40 text-[var(--ink-3)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-[var(--ink)]">
                {t("cleaning.offTitle")}
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-[var(--ink-3)]">
                {t("cleaning.offDesc")}
              </p>
            </div>
          )}
        </div>

        {/* Settings sidebar — borderless rounded panel + soft shadow,
            same elevation language as the calendar's aside. lg:top-3
            for breathing room from the global header. */}
        <aside className="w-full lg:w-[360px] lg:shrink-0 lg:sticky lg:top-3 lg:self-start lg:max-h-[calc(100vh-84px)] rounded-2xl bg-[var(--bg)] shadow-[0_1px_3px_-1px_rgba(0,0,0,0.04),0_4px_16px_-8px_rgba(0,0,0,0.06)] [overflow:clip]">
          {/* Header */}
          <div className="border-b border-[var(--line)] px-5 py-4">
            <div className="text-xs uppercase tracking-wide text-[var(--ink-4)]">
              {locale === "ru" ? "Уборки" : "Cleaning"}
            </div>
            <div className="mt-0.5 text-base font-semibold text-[var(--ink)] truncate">
              {property.name}
            </div>
          </div>

          {/* Master toggle (RT-25.3) */}
          <div className="border-b border-[var(--line)] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--ink)]">
                  {t("cleaning.toggleLabel")}
                </div>
                <p className="mt-0.5 text-xs text-[var(--ink-3)] leading-relaxed">
                  {t("cleaning.toggleHint")}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={cleaningEnabled}
                disabled={toggling}
                onClick={() => handleToggle(!cleaningEnabled)}
                className={
                  "relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors disabled:opacity-50 " +
                  (cleaningEnabled ? "bg-[var(--m-accent)]" : "bg-[var(--line-2)]")
                }
              >
                <span
                  className={
                    "inline-block h-5 w-5 transform rounded-full bg-white transition-transform " +
                    (cleaningEnabled ? "translate-x-5" : "translate-x-0.5")
                  }
                />
              </button>
            </div>
          </div>

          {/* View options + actions — only meaningful when cleaning logic is on */}
          {cleaningEnabled && (
            <>
              <div className="border-b border-[var(--line)] px-5 py-4">
                <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)] mb-2.5">
                  {locale === "ru" ? "Отображение" : "View"}
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includePotential}
                    onChange={(e) => setIncludePotential(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--line-2)] accent-[var(--m-accent)] cursor-pointer"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[var(--ink)]">
                      {t("cleaning.includePotential")}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--ink-3)] leading-relaxed">
                      {locale === "ru"
                        ? "Уборки, которые понадобятся только если промежуток будет занят гостем."
                        : "Cleanings that only matter if a gap-fill guest books."}
                    </span>
                  </span>
                </label>
              </div>

              <div className="px-5 py-4">
                <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)] mb-2.5">
                  {locale === "ru" ? "Экспорт" : "Export"}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-2 rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-3 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--bg-3)]"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                    {copied ? t("common.copied") : t("cleaning.copySchedule")}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-3 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--bg-3)]"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                    </svg>
                    {t("cleaning.printSchedule")}
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-[var(--ink-4)] leading-relaxed">
                  {locale === "ru"
                    ? "Имя объекта попадёт в шапку скопированного и печатного списка."
                    : "The property name appears in the header of the copied and printed list."}
                </p>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
