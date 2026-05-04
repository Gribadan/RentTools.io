"use client";

import { useCallback, useEffect, useState } from "react";
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

interface CleanerAppProps {
  user: { userId: number; username: string; role: string };
  onLogout: () => void;
}

export function CleanerApp({ user, onLogout }: CleanerAppProps) {
  const { t, locale, setLocale } = useI18n();
  const [properties, setProperties] = useState<Property[]>([]);
  const [syncedEvents, setSyncedEvents] = useState<Record<number, CalendarEvent[]>>({});
  const [links, setLinks] = useState<Record<number, CalendarLink[]>>({});
  const [overrides, setOverrides] = useState<Record<number, DateOverride[]>>({});
  const [loading, setLoading] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const propsRes = await fetch("/api/properties");
      const propsData = await propsRes.json();
      const props: Property[] = Array.isArray(propsData) ? propsData : [];
      setProperties(props);

      if (props.length === 0) {
        setSyncedEvents({});
        setLinks({});
        setOverrides({});
        return;
      }

      const results = await Promise.all(
        props.map(async (p) => {
          const [syncRes, linksRes, ovRes] = await Promise.all([
            fetch(`/api/calendar/sync?propertyId=${p.id}&limit=200`).then((r) => r.json()),
            fetch(`/api/calendar/links?propertyId=${p.id}`).then((r) => r.json()),
            fetch(`/api/date-overrides?propertyId=${p.id}`).then((r) => r.json()),
          ]);
          return {
            id: p.id,
            events: (syncRes.events || []) as CalendarEvent[],
            links: (linksRes || []) as CalendarLink[],
            overrides: (ovRes || []) as DateOverride[],
          };
        })
      );
      const ev: Record<number, CalendarEvent[]> = {};
      const ln: Record<number, CalendarLink[]> = {};
      const ov: Record<number, DateOverride[]> = {};
      for (const r of results) {
        ev[r.id] = r.events;
        ln[r.id] = r.links;
        ov[r.id] = r.overrides;
      }
      setSyncedEvents(ev);
      setLinks(ln);
      setOverrides(ov);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0d1117]">
      <header className="flex items-center justify-between border-b border-[#27272b] bg-[#18181b] px-4 h-14">
        <div className="flex items-center gap-2 text-[#e8e8ec]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111113]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7.5l9-5.25 9 5.25v9L12 21.75 3 16.5v-9z"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold">
            {locale === "ru" ? "График уборок" : "Cleaning schedule"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-[#333338] overflow-hidden">
            <button
              onClick={() => setLocale("ru")}
              className={`px-2 py-1 text-xs ${locale === "ru" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a]"}`}
            >
              RU
            </button>
            <button
              onClick={() => setLocale("en")}
              className={`px-2 py-1 text-xs ${locale === "en" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a]"}`}
            >
              EN
            </button>
          </div>
          <span className="hidden sm:block text-xs text-[#a0a0a8]">
            {user.username}{" "}
            <span className="rounded bg-[#27272b] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[#a0a0a8]">
              {locale === "ru" ? "уборщик" : "cleaner"}
            </span>
          </span>
          <button
            onClick={onLogout}
            className="rounded-md px-2.5 py-1.5 text-xs text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
          >
            {t("sidebar.logout")}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#30363d] border-t-[#58a6ff]" />
            </div>
          ) : properties.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#27272b] py-16 text-center">
              <p className="text-sm text-[#71717a]">
                {locale === "ru"
                  ? "Вам пока не назначили объекты для уборки."
                  : "No properties have been assigned to you for cleaning yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex justify-end">
                <button
                  onClick={() => setSummaryOpen(true)}
                  className="rounded-md border border-[#333338] bg-[#18181b] px-3 py-1.5 text-xs text-[#e8e8ec] transition-colors hover:bg-[#27272b]"
                >
                  {locale === "ru" ? "Краткий план / печать" : "Summary / print"}
                </button>
              </div>
              <CleaningSchedule
                properties={properties}
                syncedEvents={syncedEvents}
                links={links}
                overrides={overrides}
                mode="dashboard"
                onOverrideChanged={fetchData}
              />
              <CleaningSummary
                open={summaryOpen}
                onClose={() => setSummaryOpen(false)}
                properties={properties}
                syncedEvents={syncedEvents}
                links={links}
                overrides={overrides}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
