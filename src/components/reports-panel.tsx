"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useI18n } from "@/lib/i18n/context";
import type { Property } from "@/lib/types";

// Bundled platform presets — kept inline rather than imported from
// @/lib/platforms because that module's lazy `import("@/lib/prisma")`
// gets traced into the client bundle by Turbopack and breaks the
// build (prisma uses node:module). The reports panel only needs
// slug → label/color, no DB access required.
const FALLBACK_PLATFORM_COLOR = "#6B7280";

const PLATFORM_PRESETS: ReadonlyArray<{ slug: string; displayName: string; color: string }> = [
  { slug: "airbnb", displayName: "Airbnb", color: "#FF385C" },
  { slug: "booking", displayName: "Booking.com", color: "#003580" },
  { slug: "vrbo", displayName: "Vrbo", color: "#245ABC" },
  { slug: "expedia", displayName: "Expedia", color: "#FFC72C" },
  { slug: "hostaway", displayName: "Hostaway", color: "#2E5BFF" },
  { slug: "lodgify", displayName: "Lodgify", color: "#00B5AD" },
  { slug: "hospitable", displayName: "Hospitable", color: "#1B5E20" },
  { slug: "smoobu", displayName: "Smoobu", color: "#4A148C" },
  { slug: "houfy", displayName: "Houfy", color: "#D84315" },
  { slug: "plumguide", displayName: "Plum Guide", color: "#2E1065" },
  { slug: "whimstay", displayName: "Whimstay", color: "#FF7043" },
  { slug: "direct", displayName: "Direct", color: FALLBACK_PLATFORM_COLOR },
];

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
function resolvePlatformColor(color: string | null | undefined): string {
  if (!color) return FALLBACK_PLATFORM_COLOR;
  return HEX_COLOR_RE.test(color) ? color : FALLBACK_PLATFORM_COLOR;
}

interface ReportsPanelProps {
  /** RT-25.5 — Reports follows the dashboard's selected property; no
   *  internal selector, no fallback to "all". When null the panel
   *  prompts the user to pick a property. */
  property: Property | null;
}

interface CalendarEventRow {
  id: number;
  platform: string;
  summary: string;
  startDate: string;
  endDate: string;
}

interface MonthBucket {
  key: string;
  label: string;
  year: number;
  monthIndex: number;
  totalDays: number;
  /** Per-platform occupancy: platform slug -> nights occupied in this month. */
  perPlatform: Record<string, number>;
}

const FORWARD_MIN_MONTHS = 3;
const FORWARD_MAX_MONTHS = 6;

function ymKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface NormalizedStay {
  start: string; // YYYY-MM-DD inclusive
  end: string;   // YYYY-MM-DD exclusive (checkout day not occupied)
  platform: string;
}

/**
 * Build forward-looking month buckets starting at the current calendar
 * month. RT-25.5: 3 months by default; expand up to 6 months if the
 * property has bookings further out. Past months are not included —
 * Reports is forward-only.
 */
function buildForwardMonths(stays: NormalizedStay[]): MonthBucket[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  // How many months out do we need? Look at the latest end date among stays.
  let monthsNeeded = FORWARD_MIN_MONTHS;
  for (const s of stays) {
    const end = new Date(s.end + "T00:00:00");
    if (end <= start) continue;
    const diffMonths =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    if (diffMonths > monthsNeeded) monthsNeeded = diffMonths;
  }
  if (monthsNeeded > FORWARD_MAX_MONTHS) monthsNeeded = FORWARD_MAX_MONTHS;

  const buckets: MonthBucket[] = [];
  for (let i = 0; i < monthsNeeded; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    buckets.push({
      key: ymKey(year, monthIndex),
      label: d.toLocaleDateString("en-GB", { month: "short" }),
      year,
      monthIndex,
      totalDays,
      perPlatform: {},
    });
  }
  return buckets;
}

/**
 * Distribute each stay's occupied days across the month buckets, keyed
 * by platform slug. Days are counted on [start, end) (checkout day not
 * occupied) so consecutive stays don't double-count the turnover day.
 */
function fillBuckets(buckets: MonthBucket[], stays: NormalizedStay[]): void {
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  const firstBucket = buckets[0];
  if (!firstBucket) return;
  const horizonStart = new Date(firstBucket.year, firstBucket.monthIndex, 1);
  const lastBucket = buckets[buckets.length - 1];
  const horizonEnd = new Date(lastBucket.year, lastBucket.monthIndex + 1, 1);

  for (const s of stays) {
    const stayStart = new Date(s.start + "T00:00:00");
    const stayEndExclusive = new Date(s.end + "T00:00:00");
    if (stayEndExclusive <= horizonStart) continue;
    if (stayStart >= horizonEnd) continue;

    const cur = new Date(Math.max(stayStart.getTime(), horizonStart.getTime()));
    const stop = new Date(Math.min(stayEndExclusive.getTime(), horizonEnd.getTime()));
    while (cur < stop) {
      const key = ymKey(cur.getFullYear(), cur.getMonth());
      const bucket = byKey.get(key);
      if (bucket) {
        bucket.perPlatform[s.platform] = (bucket.perPlatform[s.platform] ?? 0) + 1;
      }
      cur.setDate(cur.getDate() + 1);
    }
  }
}

interface PlatformMeta {
  slug: string;
  label: string;
  color: string;
}

function platformMeta(slug: string): PlatformMeta {
  const preset = PLATFORM_PRESETS.find((p) => p.slug === slug);
  if (preset) return { slug, label: preset.displayName, color: resolvePlatformColor(preset.color) };
  // Unknown / custom platform — use a neutral color and the slug as label.
  return { slug, label: slug.charAt(0).toUpperCase() + slug.slice(1), color: FALLBACK_PLATFORM_COLOR };
}

export function ReportsPanel({ property }: ReportsPanelProps) {
  const { locale } = useI18n();
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportScope, setExportScope] = useState<"all" | "selected">("all");
  const [events, setEvents] = useState<CalendarEventRow[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!property) {
      setEvents([]);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    fetch(`/api/calendar/sync?propertyId=${property.id}&limit=500`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setEvents(Array.isArray(data.events) ? data.events : []);
      })
      .catch(() => {
        // ignore aborts and network errors — empty events fall through to "no data"
      });
    return () => ac.abort();
  }, [property?.id]);

  const stays: NormalizedStay[] = useMemo(() => {
    if (!property) return [];
    const out: NormalizedStay[] = [];
    // iCal-synced events. Their endDate already follows the iCal
    // convention (DTEND = checkout, exclusive), so use it as `end` directly.
    for (const ev of events) {
      const platform = (ev.platform || "").toLowerCase();
      // Skip Airbnb host-blocks (no real revenue stay) so they don't
      // inflate the chart. Real stays carry summaries like "Reserved"
      // or guest names; blocks say "Not available" / "Blocked".
      const isAirbnbBlock = platform === "airbnb" && (
        ev.summary.includes("Not available") || ev.summary.includes("Blocked")
      );
      if (isAirbnbBlock) continue;
      out.push({ start: ev.startDate, end: ev.endDate, platform });
    }
    // Manually-entered Reservation rows. checkOut is also exclusive
    // (the guest is gone by checkOut), so convert with isoDate directly.
    for (const r of property.reservations) {
      const ci = new Date(r.checkIn);
      const co = new Date(r.checkOut);
      out.push({
        start: isoDate(ci),
        end: isoDate(co),
        platform: (r.platform || "direct").toLowerCase(),
      });
    }
    return out;
  }, [property, events]);

  const buckets = useMemo(() => {
    if (!property) return [];
    const buckets = buildForwardMonths(stays);
    fillBuckets(buckets, stays);
    return buckets;
  }, [property, stays]);

  // Which platforms actually appear across the visible months? Sorted
  // by total nights desc so the largest stack segment renders bottom.
  const activePlatforms = useMemo(() => {
    const totals = new Map<string, number>();
    for (const b of buckets) {
      for (const [slug, nights] of Object.entries(b.perPlatform)) {
        totals.set(slug, (totals.get(slug) ?? 0) + nights);
      }
    }
    const entries = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    return entries.map(([slug]) => platformMeta(slug));
  }, [buckets]);

  // Recharts data shape: one row per month with one numeric key per platform.
  const chartData = useMemo(
    () =>
      buckets.map((b) => {
        const row: Record<string, string | number> = { label: b.label };
        for (const platform of activePlatforms) {
          row[platform.slug] = b.perPlatform[platform.slug] ?? 0;
        }
        return row;
      }),
    [buckets, activePlatforms],
  );

  const downloadCsv = () => {
    if (!property) return;
    const params = new URLSearchParams();
    if (exportFrom) params.set("from", exportFrom);
    if (exportTo) params.set("to", exportTo);
    if (exportScope === "selected") params.set("propertyId", String(property.id));
    const qs = params.toString();
    window.location.href = `/api/reservations/export${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">
          {locale === "ru" ? "Отчёты" : "Reports"}
        </h1>
        <p className="mt-1 text-xs text-[var(--ink-4)]">
          {locale === "ru"
            ? "Прогноз на ближайшие 3+ месяца, разбивка по источникам бронирований"
            : "Next 3+ months by reservation source"}
        </p>
      </div>

      {!property ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-6 text-center text-xs text-[var(--ink-4)]">
          {locale === "ru"
            ? "Выберите объект сверху, чтобы увидеть отчёт."
            : "Select a property in the header to see its report."}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#27272b" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#a0a0a8", fontSize: 11 }}
                  axisLine={{ stroke: "#333338" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#a0a0a8", fontSize: 11 }}
                  axisLine={{ stroke: "#333338" }}
                  tickLine={false}
                  unit={locale === "ru" ? "д" : "d"}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255, 56, 92, 0.08)" }}
                  contentStyle={{
                    background: "#111113",
                    border: "1px solid #333338",
                    borderRadius: 8,
                    color: "#e8e8ec",
                    fontSize: 12,
                  }}
                  formatter={(value, name) => {
                    const meta = activePlatforms.find((p) => p.slug === name);
                    const label = meta?.label ?? String(name);
                    const unit = locale === "ru" ? "ноч." : "nights";
                    return [`${value} ${unit}`, label];
                  }}
                  labelStyle={{ color: "#a0a0a8" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  iconType="square"
                  wrapperStyle={{ fontSize: 11, color: "#a0a0a8" }}
                  formatter={(slug) => {
                    const meta = activePlatforms.find((p) => p.slug === slug);
                    return meta?.label ?? slug;
                  }}
                />
                {activePlatforms.map((p, idx) => (
                  <Bar
                    key={p.slug}
                    dataKey={p.slug}
                    stackId="src"
                    fill={p.color}
                    // Round the top of the topmost segment only so the
                    // stack reads as one bar with a single rounded cap.
                    radius={idx === activePlatforms.length - 1 ? [4, 4, 0, 0] : 0}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {activePlatforms.length === 0 && (
            <p className="mt-2 text-center text-xs text-[var(--ink-4)]">
              {locale === "ru"
                ? "Нет бронирований в ближайшие месяцы."
                : "No bookings in the upcoming months."}
            </p>
          )}
        </div>
      )}

      {/* Reservations CSV export — Reports stays read-only for writes
          (Import dropped per RT-25.5) but export is still useful. */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4">
        <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">
          {locale === "ru" ? "Экспорт броней (CSV)" : "Export reservations (CSV)"}
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-[var(--ink-4)]">
              {locale === "ru" ? "С" : "From"}
            </label>
            <input
              type="date"
              value={exportFrom}
              onChange={(e) => setExportFrom(e.target.value)}
              className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-[var(--ink-4)]">
              {locale === "ru" ? "По" : "To"}
            </label>
            <input
              type="date"
              value={exportTo}
              onChange={(e) => setExportTo(e.target.value)}
              className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-[var(--ink-4)]">
              {locale === "ru" ? "Объекты" : "Scope"}
            </label>
            <select
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value as "all" | "selected")}
              className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            >
              <option value="all">{locale === "ru" ? "Все объекты" : "All properties"}</option>
              <option value="selected" disabled={!property}>
                {property ? property.name : locale === "ru" ? "Только выбранный" : "Selected only"}
              </option>
            </select>
          </div>
          <button
            onClick={downloadCsv}
            disabled={!property}
            className="ml-auto h-8 rounded-md bg-[var(--m-accent)] px-3 text-xs font-medium text-white hover:bg-[var(--m-accent-2)] disabled:opacity-40"
          >
            {locale === "ru" ? "Скачать CSV" : "Export reservations CSV"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-[var(--ink-4)]">
          {locale === "ru"
            ? "Пустые поля = выгрузить все. Файл с UTF-8 BOM, открывается в Excel с кириллицей."
            : "Leave dates blank to export everything. UTF-8 BOM ensures Excel opens Cyrillic correctly."}
        </p>
      </div>
    </div>
  );
}
