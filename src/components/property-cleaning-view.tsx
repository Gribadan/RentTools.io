"use client";

import { useState, useEffect, useCallback } from "react";
import { CleaningSchedule } from "@/components/cleaning-schedule";
import { CleaningSummary } from "@/components/cleaning-summary";
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
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [cleaningEnabled, setCleaningEnabled] = useState<boolean>(property.cleaningEnabled !== false);
  const [toggling, setToggling] = useState(false);

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

  return (
    <div className="cls-isolate mx-auto max-w-5xl space-y-3">
      {/* Master toggle — RT-25.3 */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-[var(--ink)]">
              {t("cleaning.toggleLabel")}
            </div>
            <p className="mt-0.5 text-xs text-[var(--ink-3)]">
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

      {cleaningEnabled ? (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setSummaryOpen(true)}
              className="rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-3 py-1.5 text-xs text-[var(--ink)] transition-colors hover:bg-[var(--line-2)]"
            >
              {locale === "ru" ? "Краткий план / печать" : "Summary / print"}
            </button>
          </div>
          <CleaningSchedule
            properties={[property]}
            syncedEvents={{ [property.id]: syncedEvents }}
            links={{ [property.id]: links }}
            overrides={{ [property.id]: overrides }}
            mode="property"
            selectedPropertyId={property.id}
            onOverrideChanged={fetchData}
          />
          <CleaningSummary
            open={summaryOpen}
            onClose={() => setSummaryOpen(false)}
            properties={[property]}
            syncedEvents={{ [property.id]: syncedEvents }}
            links={{ [property.id]: links }}
            overrides={{ [property.id]: overrides }}
          />
        </>
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
  );
}
