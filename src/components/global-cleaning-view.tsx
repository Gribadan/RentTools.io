"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CleaningSchedule, type CleaningScheduleHandle, type CleanerAssignmentInfo } from "@/components/cleaning-schedule";
import { useI18n } from "@/lib/i18n/context";
import type { Property, CalendarLink, DateOverride } from "@/lib/types";

interface CalendarEvent {
  id: number;
  platform: string;
  summary: string;
  startDate: string;
  endDate: string;
}

interface GlobalCleaningViewProps {
  properties: Property[];
}

/**
 * Cross-property cleaning view rendered when activeView === "cleaning"
 * AND no property is selected. Mirrors PropertyCleaningView's shell
 * (two-column layout + borderless sidebar) but without the per-property
 * concerns (master toggle, cleaners panel) — those live on the per-
 * property cleaning view.
 *
 * Self-fetches calendar data per property in parallel; the shape mirrors
 * what dashboard.tsx already does for the inline cleaning preview.
 */
export function GlobalCleaningView({ properties }: GlobalCleaningViewProps) {
  const { t, locale } = useI18n();
  const [syncedEvents, setSyncedEvents] = useState<Record<number, CalendarEvent[]>>({});
  const [links, setLinks] = useState<Record<number, CalendarLink[]>>({});
  const [overrides, setOverrides] = useState<Record<number, DateOverride[]>>({});
  const [assignmentsByProperty, setAssignmentsByProperty] = useState<Record<number, CleanerAssignmentInfo[]>>({});
  const [includePotential, setIncludePotential] = useState(true);
  const [copied, setCopied] = useState(false);
  const scheduleRef = useRef<CleaningScheduleHandle>(null);

  const fetchData = useCallback(async () => {
    if (properties.length === 0) {
      setSyncedEvents({});
      setLinks({});
      setOverrides({});
      setAssignmentsByProperty({});
      return;
    }
    type AssignmentRow = {
      cleanerProfileId: number | null;
      cleanerId: number | null;
      cleanerName: string | null;
      username: string | null;
      priority: number;
    };
    const results = await Promise.all(
      properties.map(async (p) => {
        const [syncRes, linksRes, ovRes, asgRes] = await Promise.all([
          fetch(`/api/calendar/sync?propertyId=${p.id}&limit=200`).then((r) => r.json()),
          fetch(`/api/calendar/links?propertyId=${p.id}`).then((r) => r.json()),
          fetch(`/api/date-overrides?propertyId=${p.id}`).then((r) => r.json()),
          fetch(`/api/cleaner-assignments?propertyId=${p.id}`).then((r) => (r.ok ? r.json() : [])),
        ]);
        const list: AssignmentRow[] = Array.isArray(asgRes) ? asgRes : [];
        const assignments = list
          .map((a): CleanerAssignmentInfo | null => {
            const name = a.cleanerName ?? a.username;
            if (!name) return null;
            const identityKey = a.cleanerProfileId != null
              ? `p:${a.cleanerProfileId}`
              : a.cleanerId != null
                ? `u:${a.cleanerId}`
                : `n:${name}`;
            return { identityKey, name, priority: a.priority ?? 0 };
          })
          .filter((x): x is CleanerAssignmentInfo => x !== null)
          .sort((a, b) => a.priority - b.priority);
        return {
          id: p.id,
          events: (syncRes.events || []) as CalendarEvent[],
          links: (linksRes || []) as CalendarLink[],
          overrides: (ovRes || []) as DateOverride[],
          assignments,
        };
      })
    ).catch(() => []);
    const evMap: Record<number, CalendarEvent[]> = {};
    const lnMap: Record<number, CalendarLink[]> = {};
    const ovMap: Record<number, DateOverride[]> = {};
    const asgMap: Record<number, CleanerAssignmentInfo[]> = {};
    for (const r of results) {
      evMap[r.id] = r.events;
      lnMap[r.id] = r.links;
      ovMap[r.id] = r.overrides;
      if (r.assignments.length > 0) asgMap[r.id] = r.assignments;
    }
    setSyncedEvents(evMap);
    setLinks(lnMap);
    setOverrides(ovMap);
    setAssignmentsByProperty(asgMap);
  }, [properties]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate fetch-on-mount pattern; setState happens inside the async callback
    fetchData();
  }, [fetchData]);

  const handleCopy = () => {
    scheduleRef.current?.copy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handlePrint = () => {
    scheduleRef.current?.print();
  };

  if (properties.length === 0) {
    return (
      <div className="-mx-3 sm:-mx-6 lg:-mx-8">
        <div className="mx-auto max-w-[1760px] px-3 sm:px-5">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-6 text-center text-xs text-[var(--ink-4)]">
            {locale === "ru"
              ? "Добавьте объект, чтобы увидеть расписание уборок."
              : "Add a property to see the cleaning schedule."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[1760px] px-3 sm:px-5 flex flex-col lg:flex-row gap-6">
        <div className="min-w-0 lg:flex-1 space-y-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">
              {locale === "ru" ? "Уборки" : "Cleaning"}
            </h1>
            <p className="mt-1 text-xs text-[var(--ink-3)]">
              {locale === "ru"
                ? `По всем объектам (${properties.length})`
                : `Across all ${properties.length} ${properties.length === 1 ? "property" : "properties"}`}
            </p>
          </div>
          <CleaningSchedule
            ref={scheduleRef}
            properties={properties}
            syncedEvents={syncedEvents}
            links={links}
            overrides={overrides}
            mode="dashboard"
            onOverrideChanged={fetchData}
            hideControls
            includePotential={includePotential}
            onIncludePotentialChange={setIncludePotential}
            cleanerAssignments={assignmentsByProperty}
          />
        </div>

        {/* Sidebar — same shell as PropertyCleaningView, but without
            the per-property pieces (master toggle / cleaners panel).
            View options + Export are global concerns and belong here. */}
        <aside className="w-full lg:w-[360px] lg:shrink-0 lg:sticky lg:top-3 lg:self-start lg:max-h-[calc(100vh-84px)] rounded-2xl bg-[var(--bg)] shadow-[0_1px_3px_-1px_rgba(0,0,0,0.04),0_4px_16px_-8px_rgba(0,0,0,0.06)] [overflow:clip]">
          <div className="border-b border-[var(--line)] px-5 py-4">
            <div className="text-xs uppercase tracking-wide text-[var(--ink-4)]">
              {locale === "ru" ? "Уборки" : "Cleaning"}
            </div>
            <div className="mt-0.5 text-base font-semibold text-[var(--ink)] truncate">
              {locale === "ru"
                ? `Все объекты (${properties.length})`
                : `All properties (${properties.length})`}
            </div>
          </div>

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
                ? "Имя каждого объекта появится в каждой строке списка."
                : "Each row in the export is tagged with its property name."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
