"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Property, CalendarLink, DateOverride } from "@/lib/types";

interface CalendarEvent {
  id: number;
  platform: string;
  summary: string;
  startDate: string;
  endDate: string;
}

interface CleaningRecord {
  id: number;
  propertyId: number;
  date: string;
  status: "pending" | "done" | "skipped";
}

interface CleaningSummaryProps {
  open: boolean;
  onClose: () => void;
  properties: Property[];
  syncedEvents: Record<number, CalendarEvent[]>;
  links: Record<number, CalendarLink[]>;
  overrides?: Record<number, DateOverride[]>;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
}

interface CleaningEntry {
  date: string;
  property: string;
  propertyId: number;
  reason: string;
  bufferMode: "full" | "quick";
  isManual: boolean;
}

function computeSimpleCleaningDays(
  property: Property,
  events: CalendarEvent[],
  links: CalendarLink[],
  dateOverrides: DateOverride[] = [],
  fromDate: string,
  toDate: string
): CleaningEntry[] {
  const out: CleaningEntry[] = [];
  const allBooked = new Set<string>();
  const maxBefore = Math.max(0, ...links.map((l) => l.bufferBefore), 0);
  const maxAfter = Math.max(0, ...links.map((l) => l.bufferAfter), 0);

  interface Booking { start: string; end: string; name: string; platform: string }
  const allBookings: Booking[] = [];

  for (const ev of events) {
    let d = ev.startDate;
    while (d <= ev.endDate) {
      allBooked.add(d);
      d = addDaysStr(d, 1);
    }
    const isAirbnbBlock = ev.platform === "airbnb" && (ev.summary.includes("Not available") || ev.summary.includes("Blocked"));
    const name = isAirbnbBlock ? "Airbnb block" : ev.summary || "Reserved";
    allBookings.push({ start: ev.startDate, end: ev.endDate, name, platform: ev.platform });
  }
  for (const res of property.reservations) {
    const start = toDateStr(new Date(res.checkIn));
    const end = toDateStr(new Date(res.checkOut));
    let d = start;
    while (d <= end) {
      allBooked.add(d);
      d = addDaysStr(d, 1);
    }
    allBookings.push({ start, end, name: res.name, platform: res.platform || "airbnb" });
  }
  allBookings.sort((a, b) => a.start.localeCompare(b.start));

  const closedDates = dateOverrides.filter((o) => o.type === "closed");
  const openDates = new Set(dateOverrides.filter((o) => o.type === "open").map((o) => o.date));
  const bufferMode: "full" | "quick" = maxBefore === 0 && maxAfter === 0 ? "quick" : "full";

  // Quick (buffer=0): cleaning = checkout day
  if (bufferMode === "quick") {
    for (const b of allBookings) {
      if (b.end >= fromDate && b.end <= toDate && !openDates.has(b.end)) {
        out.push({
          date: b.end,
          property: property.name,
          propertyId: property.id,
          reason: `After ${b.name}`,
          bufferMode,
          isManual: false,
        });
      }
    }
  } else {
    // Full buffer: cleanings on B+1..B+maxAfter and on (next.start - maxBefore)..next.start - 1
    for (const b of allBookings) {
      for (let i = 1; i <= maxAfter; i++) {
        const d = addDaysStr(b.end, i);
        if (d < fromDate || d > toDate) continue;
        if (allBooked.has(d) || openDates.has(d)) continue;
        out.push({
          date: d,
          property: property.name,
          propertyId: property.id,
          reason: `After ${b.name}`,
          bufferMode,
          isManual: false,
        });
      }
      for (let i = 1; i <= maxBefore; i++) {
        const d = addDaysStr(b.start, -i);
        if (d < fromDate || d > toDate) continue;
        if (allBooked.has(d) || openDates.has(d)) continue;
        out.push({
          date: d,
          property: property.name,
          propertyId: property.id,
          reason: `Before ${b.name}`,
          bufferMode,
          isManual: false,
        });
      }
    }
  }

  for (const o of closedDates) {
    if (o.date < fromDate || o.date > toDate) continue;
    out.push({
      date: o.date,
      property: property.name,
      propertyId: property.id,
      reason: o.note || "Manual cleaning",
      bufferMode,
      isManual: true,
    });
  }

  return out;
}

export function CleaningSummary({
  open,
  onClose,
  properties,
  syncedEvents,
  links,
  overrides,
}: CleaningSummaryProps) {
  const { locale } = useI18n();
  const [records, setRecords] = useState<Record<string, CleaningRecord>>({});

  useEffect(() => {
    if (!open || properties.length === 0) return;
    const ids = properties.map((p) => p.id).join(",");
    fetch(`/api/cleaning-records?propertyIds=${ids}`)
      .then((r) => (r.ok ? r.json() : { records: [] }))
      .then((data) => {
        const map: Record<string, CleaningRecord> = {};
        for (const r of (data.records || []) as CleaningRecord[]) {
          map[`${r.propertyId}-${r.date}`] = r;
        }
        setRecords(map);
      })
      .catch(() => {});
  }, [open, properties]);

  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const tomorrowStr = useMemo(() => addDaysStr(todayStr, 1), [todayStr]);
  const weekEndStr = useMemo(() => addDaysStr(todayStr, 6), [todayStr]);

  const entries = useMemo(() => {
    if (!open) return [] as CleaningEntry[];
    const all: CleaningEntry[] = [];
    for (const prop of properties) {
      all.push(
        ...computeSimpleCleaningDays(
          prop,
          syncedEvents[prop.id] || [],
          links[prop.id] || [],
          overrides?.[prop.id] || [],
          todayStr,
          weekEndStr
        )
      );
    }
    all.sort((a, b) => a.date.localeCompare(b.date) || a.property.localeCompare(b.property));
    return all;
  }, [open, properties, syncedEvents, links, overrides, todayStr, weekEndStr]);

  if (!open) return null;

  const today = entries.filter((e) => e.date === todayStr);
  const tomorrow = entries.filter((e) => e.date === tomorrowStr);
  const week = entries.filter((e) => e.date > tomorrowStr && e.date <= weekEndStr);

  const formatDate = (d: string) => {
    const date = new Date(d + "T12:00:00");
    return date.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  const renderRow = (e: CleaningEntry) => {
    const rec = records[`${e.propertyId}-${e.date}`];
    const status = rec?.status;
    return (
      <li
        key={`${e.propertyId}-${e.date}-${e.reason}`}
        className="flex items-center justify-between gap-3 border-b border-[var(--line)] py-1.5 print:border-gray-300 last:border-b-0"
      >
        <div className="flex items-center gap-3 text-sm">
          <span className="w-24 font-medium text-[var(--ink)] print:text-black">{formatDate(e.date)}</span>
          <span className="text-[var(--ink)] print:text-black">{e.property}</span>
          <span className="text-xs text-[var(--ink-3)] print:text-gray-700">{e.reason}</span>
        </div>
        <span
          className={
            "text-xs font-semibold uppercase tracking-wider " +
            (status === "done"
              ? "text-emerald-500"
              : status === "skipped"
              ? "text-[var(--ink-4)]"
              : "text-amber-400")
          }
        >
          {status === "done"
            ? locale === "ru" ? "Готово" : "Done"
            : status === "skipped"
            ? locale === "ru" ? "Пропущено" : "Skipped"
            : locale === "ru" ? "К уборке" : "Pending"}
        </span>
      </li>
    );
  };

  const Section = ({ title, items }: { title: string; items: CleaningEntry[] }) => (
    <section className="mb-5">
      <h3 className="mb-2 border-b border-[var(--line)] pb-1 text-sm font-semibold uppercase tracking-wider text-[var(--ink-3)] print:border-gray-400 print:text-black">
        {title}{" "}
        <span className="ml-1 text-xs font-normal text-[var(--ink-4)]">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--ink-4)] print:text-gray-600">
          {locale === "ru" ? "Уборок нет" : "Nothing scheduled"}
        </p>
      ) : (
        <ul>{items.map(renderRow)}</ul>
      )}
    </section>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:relative print:inset-auto print:bg-white print:p-0">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] p-6 shadow-2xl print:max-w-full print:border-0 print:bg-white print:shadow-none">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <h2 className="text-lg font-semibold text-[var(--ink)]">
            {locale === "ru" ? "Краткий план уборок" : "Cleaning summary"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="rounded-md border border-[var(--line-2)] px-3 py-1.5 text-xs text-[var(--ink)] hover:bg-[var(--line-2)]"
            >
              {locale === "ru" ? "Печать" : "Print"}
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-[var(--ink-3)] hover:bg-[var(--line-2)] hover:text-[var(--ink)]"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <h1 className="mb-4 hidden text-xl font-bold text-black print:block">
          {locale === "ru" ? "Краткий план уборок" : "Cleaning summary"}
        </h1>

        <div className="max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible">
          <Section
            title={locale === "ru" ? "Сегодня" : "Today"}
            items={today}
          />
          <Section
            title={locale === "ru" ? "Завтра" : "Tomorrow"}
            items={tomorrow}
          />
          <Section
            title={locale === "ru" ? "Эта неделя" : "Rest of week"}
            items={week}
          />
        </div>
      </div>
    </div>
  );
}
