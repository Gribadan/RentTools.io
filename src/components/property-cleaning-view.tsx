"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { CleaningSchedule, type CleanerAssignmentInfo } from "@/components/cleaning-schedule";
import { CleanersPanel } from "@/components/cleaners-panel";
import { PropertySwitcher } from "@/components/property-switcher";
import { useI18n } from "@/lib/i18n/context";
import type { Property, CalendarLink, DateOverride } from "@/lib/types";

// View / display options live in the sidebar so they sit alongside the
// other per-property settings (master toggle, cleaners). Copy + Print
// moved to the schedule's table header.

interface CalendarEvent {
  id: number;
  platform: string;
  summary: string;
  startDate: string;
  endDate: string;
}

interface PropertyCleaningViewProps {
  property: Property;
  /** All properties the user can access — drives the sidebar's
   *  property-switcher pills so the user can jump to another
   *  property's cleaning view (or the portfolio aggregate)
   *  without needing the top-bar dropdown. */
  properties: Property[];
  /** Called after the master cleaning toggle is flipped. Lets the parent
   *  refetch the property record so other tabs (calendar, dashboard)
   *  pick up the new value without a manual refresh. */
  onCleaningEnabledChanged?: () => void;
}

export function PropertyCleaningView({ property, properties, onCleaningEnabledChanged }: PropertyCleaningViewProps) {
  const { t, locale } = useI18n();
  const [syncedEvents, setSyncedEvents] = useState<CalendarEvent[]>([]);
  const [links, setLinks] = useState<CalendarLink[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [assignments, setAssignments] = useState<CleanerAssignmentInfo[]>([]);
  const [cleaningEnabled, setCleaningEnabled] = useState<boolean>(property.cleaningEnabled !== false);
  const [toggling, setToggling] = useState(false);
  const [includePotential, setIncludePotential] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCleaningEnabled(property.cleaningEnabled !== false);
  }, [property.cleaningEnabled, property.id]);

  const fetchData = useCallback(async () => {
    try {
      const [syncRes, linksRes, ovRes, asgRes] = await Promise.all([
        fetch(`/api/calendar/sync?propertyId=${property.id}&limit=200`).then(r => r.json()),
        fetch(`/api/calendar/links?propertyId=${property.id}`).then(r => r.json()),
        fetch(`/api/date-overrides?propertyId=${property.id}`).then(r => r.json()),
        fetch(`/api/cleaner-assignments?propertyId=${property.id}`).then(r => r.ok ? r.json() : []),
      ]);
      setSyncedEvents(syncRes.events || []);
      setLinks(linksRes || []);
      setOverrides(ovRes || []);
    type AssignmentRow = {
      cleanerProfileId: number | null;
      cleanerId: number | null;
      cleanerName: string | null;
      username: string | null;
      priority: number;
    };
      const list: AssignmentRow[] = Array.isArray(asgRes) ? asgRes : [];
      setAssignments(
        list
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
          .sort((a, b) => a.priority - b.priority)
      );
    } finally {
      setLoading(false);
    }
  }, [property.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const assignmentsByProperty = useMemo<Record<number, CleanerAssignmentInfo[]> | undefined>(
    () => (assignments.length > 0 ? { [property.id]: assignments } : undefined),
    [assignments, property.id]
  );

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

  /* Two-column layout matches PropertyCalendar. Sidebar trimmed to
     the per-property concerns only (master toggle + Cleaners panel);
     view/export controls live inline in the schedule's table header
     so the host can copy + send without crossing the page. */
  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[1760px] px-3 sm:px-5 flex flex-col lg:flex-row gap-6">
        <div className="min-w-0 lg:flex-1 space-y-3">
          {cleaningEnabled ? (
            <CleaningSchedule
              properties={[property]}
              syncedEvents={{ [property.id]: syncedEvents }}
              links={{ [property.id]: links }}
              overrides={{ [property.id]: overrides }}
              mode="property"
              selectedPropertyId={property.id}
              onOverrideChanged={fetchData}
              includePotential={includePotential}
              onIncludePotentialChange={setIncludePotential}
              cleanerAssignments={assignmentsByProperty}
              loading={loading}
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

        {/* Settings sidebar — borderless rounded panel + soft shadow.
            Trimmed to per-property concerns only: master toggle and the
            Cleaners panel. Copy/Print/Include-potential live inline in
            the schedule's table header. */}
        <aside className="w-full lg:w-[360px] lg:shrink-0 lg:sticky lg:top-3 lg:self-start lg:max-h-[calc(100vh-84px)] rounded-2xl bg-[var(--bg)] shadow-[0_1px_3px_-1px_rgba(0,0,0,0.04),0_4px_16px_-8px_rgba(0,0,0,0.06)] [overflow:clip]">
          <div className="border-b border-[var(--line)] px-5 py-4 space-y-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--ink-4)]">
                {locale === "ru" ? "Уборки" : "Cleaning"}
              </div>
              <div className="mt-0.5 text-base font-semibold text-[var(--ink)] truncate">
                {property.name}
              </div>
            </div>
            <PropertySwitcher
              properties={properties}
              selectedPropertyId={property.id}
              view="cleaning"
              showAllOption
              label={null}
            />
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

          {/* Cleaners assignment (RT-25.10 tick 2) — sidebar entry that
              replaces the old SyncSettings CleanerAssignmentSection. Only
              meaningful when the cleaning surface is on. */}
          {cleaningEnabled && <CleanersPanel propertyId={property.id} />}

          {/* View options — include-potential toggle. Sits in sidebar
              so view-state stays grouped with the other settings;
              Copy / Print moved to the table header. */}
          {cleaningEnabled && (
            <div className="px-5 py-4">
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
          )}
        </aside>
      </div>
    </div>
  );
}
