"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  /** Selected property from the dashboard header. When set, the panel
   *  scopes everything (KPIs, chart, export) to this property. When
   *  null, the panel renders a portfolio-wide aggregate across all
   *  properties the user can access. */
  property: Property | null;
  /** Full list of accessible properties. Drives the multi-property
   *  aggregate when `property` is null. */
  properties: Property[];
}

interface CalendarEventRow {
  id: number;
  propertyId: number;
  uid: string;
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
  propertyId: number;
}

/**
 * Build forward-looking month buckets starting at the current calendar
 * month. 3 months by default; expand up to 6 months if any stay reaches
 * further out. Past months are not included — Reports is forward-only.
 */
function buildForwardMonths(stays: NormalizedStay[]): MonthBucket[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

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
  return { slug, label: slug.charAt(0).toUpperCase() + slug.slice(1), color: FALLBACK_PLATFORM_COLOR };
}

/** Build the deduped list of stays for one property. iCal events whose
 *  uid matches a Reservation.linkedEventUid are dropped — the Reservation
 *  side wins because it carries the host-chosen platform + name and
 *  represents the "claimed" version of the bar. */
function buildStaysForProperty(prop: Property, events: CalendarEventRow[]): NormalizedStay[] {
  const linkedUids = new Set(
    prop.reservations.map((r) => r.linkedEventUid).filter((u): u is string => !!u)
  );
  const stays: NormalizedStay[] = [];
  for (const ev of events) {
    if (ev.propertyId !== prop.id) continue;
    const platform = (ev.platform || "").toLowerCase();
    const isAirbnbBlock =
      platform === "airbnb" &&
      (ev.summary?.includes("Not available") || ev.summary?.includes("Blocked"));
    if (isAirbnbBlock) continue;
    if (ev.uid && linkedUids.has(ev.uid)) continue; // dedup against linked Reservation
    stays.push({ start: ev.startDate, end: ev.endDate, platform, propertyId: prop.id });
  }
  for (const r of prop.reservations) {
    stays.push({
      start: isoDate(new Date(r.checkIn)),
      end: isoDate(new Date(r.checkOut)),
      platform: (r.platform || "direct").toLowerCase(),
      propertyId: prop.id,
    });
  }
  return stays;
}

/** Per-property KPIs computed against the report horizon. */
interface PropertyKpis {
  property: Property;
  nights: number;
  bookings: number;
  cleanings: number; // currently == bookings; one cleaning per checkout
  occupancy: number; // percent, rounded
  topPlatform: PlatformMeta | null;
  perPlatformNights: Map<string, number>;
}

function computePropertyKpis(
  prop: Property,
  stays: NormalizedStay[],
  horizonStart: Date,
  horizonEnd: Date,
  horizonDays: number,
): PropertyKpis {
  let nights = 0;
  let bookings = 0;
  const perPlatformNights = new Map<string, number>();

  for (const s of stays) {
    if (s.propertyId !== prop.id) continue;
    const sStart = new Date(s.start + "T00:00:00");
    const sEnd = new Date(s.end + "T00:00:00");
    const clipStart = new Date(Math.max(sStart.getTime(), horizonStart.getTime()));
    const clipEnd = new Date(Math.min(sEnd.getTime(), horizonEnd.getTime()));
    if (clipStart >= clipEnd) continue;
    const stayNights = Math.round((clipEnd.getTime() - clipStart.getTime()) / 86_400_000);
    nights += stayNights;
    bookings += 1;
    perPlatformNights.set(s.platform, (perPlatformNights.get(s.platform) ?? 0) + stayNights);
  }

  const occupancy = horizonDays > 0 ? Math.round((100 * nights) / horizonDays) : 0;
  let topPlatform: PlatformMeta | null = null;
  let topNights = 0;
  for (const [slug, n] of perPlatformNights) {
    if (n > topNights) {
      topNights = n;
      topPlatform = platformMeta(slug);
    }
  }
  // Cleanings: one per checkout falling inside the horizon. A simple
  // proxy that doesn't require running the full cleaning-schedule
  // engine; matches what the host actually pays out for in this window.
  const cleanings = bookings;

  return { property: prop, nights, bookings, cleanings, occupancy, topPlatform, perPlatformNights };
}

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: boolean;
}
function KpiCard({ label, value, subtitle, accent }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] px-4 py-3.5">
      <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-4)]">{label}</div>
      <div className={`mt-1 text-2xl font-bold tracking-tight ${accent ? "text-[var(--m-accent)]" : "text-[var(--ink)]"}`}>
        {value}
      </div>
      {subtitle && (
        <div className="mt-0.5 text-[11px] text-[var(--ink-3)] leading-snug">{subtitle}</div>
      )}
    </div>
  );
}

export function ReportsPanel({ property, properties }: ReportsPanelProps) {
  const { locale } = useI18n();
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [events, setEvents] = useState<CalendarEventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const targetProperties = useMemo(
    () => (property ? [property] : properties),
    [property, properties],
  );
  const isMulti = !property;
  // Stable key so the fetch effect re-runs only on property-set changes,
  // not on every parent render that may rebuild the array.
  const targetIdsKey = useMemo(
    () => targetProperties.map((p) => p.id).sort((a, b) => a - b).join(","),
    [targetProperties],
  );

  useEffect(() => {
    if (targetProperties.length === 0) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    // For single-property mode the existing endpoint already filters by
    // propertyId; for multi-property we omit propertyId and the API
    // returns events scoped to the user's accessible set. allStays is
    // derived per-target-property so any stale events from a previous
    // mode get filtered out on render — no need to clear here.
    const url = property
      ? `/api/calendar/sync?propertyId=${property.id}&limit=2000`
      : `/api/calendar/sync?limit=5000`;
    fetch(url, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setEvents(Array.isArray(data.events) ? data.events : []);
      })
      .catch(() => {
        // ignore aborts and network errors
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [property, targetIdsKey, targetProperties.length]);

  // Build deduped stays for every target property at once.
  const allStays: NormalizedStay[] = useMemo(() => {
    const out: NormalizedStay[] = [];
    for (const p of targetProperties) {
      out.push(...buildStaysForProperty(p, events));
    }
    return out;
  }, [targetProperties, events]);

  const buckets = useMemo(() => {
    const b = buildForwardMonths(allStays);
    fillBuckets(b, allStays);
    return b;
  }, [allStays]);

  // Horizon window — derived from the bucket list so KPI math agrees
  // with the chart math.
  const horizonInfo = useMemo(() => {
    if (buckets.length === 0) {
      return { start: new Date(), end: new Date(), days: 0 };
    }
    const first = buckets[0];
    const last = buckets[buckets.length - 1];
    const start = new Date(first.year, first.monthIndex, 1);
    const end = new Date(last.year, last.monthIndex + 1, 1);
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    return { start, end, days };
  }, [buckets]);

  // Per-property KPIs.
  const propertyKpis: PropertyKpis[] = useMemo(() => {
    return targetProperties.map((p) =>
      computePropertyKpis(p, allStays, horizonInfo.start, horizonInfo.end, horizonInfo.days),
    );
  }, [targetProperties, allStays, horizonInfo]);

  // Aggregate KPIs (single mode = the one row; multi mode = sum).
  const aggregate = useMemo(() => {
    let nights = 0;
    let bookings = 0;
    let cleanings = 0;
    const perPlatform = new Map<string, number>();
    for (const k of propertyKpis) {
      nights += k.nights;
      bookings += k.bookings;
      cleanings += k.cleanings;
      for (const [slug, n] of k.perPlatformNights) {
        perPlatform.set(slug, (perPlatform.get(slug) ?? 0) + n);
      }
    }
    const totalCapacity = horizonInfo.days * targetProperties.length;
    const occupancy = totalCapacity > 0 ? Math.round((100 * nights) / totalCapacity) : 0;
    let topPlatform: PlatformMeta | null = null;
    let topNights = 0;
    for (const [slug, n] of perPlatform) {
      if (n > topNights) {
        topNights = n;
        topPlatform = platformMeta(slug);
      }
    }
    const avgStay = bookings > 0 ? Math.round((nights / bookings) * 10) / 10 : 0;
    return { nights, bookings, cleanings, occupancy, topPlatform, avgStay };
  }, [propertyKpis, horizonInfo.days, targetProperties.length]);

  // Active platforms (ordered by total nights desc) drive the chart legend.
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
    const params = new URLSearchParams();
    if (exportFrom) params.set("from", exportFrom);
    if (exportTo) params.set("to", exportTo);
    // Auto-scope: if a property is selected, export only that one;
    // otherwise the endpoint already scopes to the user's accessible set.
    if (property) params.set("propertyId", String(property.id));
    const qs = params.toString();
    window.location.href = `/api/reservations/export${qs ? `?${qs}` : ""}`;
  };

  const headerSubtitle = isMulti
    ? (locale === "ru"
        ? `Сводка по всем объектам (${properties.length}) на ближайшие ${horizonInfo.days > 0 ? Math.ceil(horizonInfo.days / 30) : 3} мес.`
        : `Portfolio-wide across ${properties.length} ${properties.length === 1 ? "property" : "properties"}, next ${horizonInfo.days > 0 ? Math.ceil(horizonInfo.days / 30) : 3} mo.`)
    : (locale === "ru"
        ? `${property!.name} — прогноз на ближайшие ${horizonInfo.days > 0 ? Math.ceil(horizonInfo.days / 30) : 3} мес.`
        : `${property!.name} — pipeline for the next ${horizonInfo.days > 0 ? Math.ceil(horizonInfo.days / 30) : 3} mo.`);

  const noData = !loading && targetProperties.length > 0 && aggregate.bookings === 0;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">
          {locale === "ru" ? "Отчёты" : "Reports"}
        </h1>
        <p className="mt-1 text-xs text-[var(--ink-3)]">{headerSubtitle}</p>
      </div>

      {targetProperties.length === 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-6 text-center text-xs text-[var(--ink-4)]">
          {locale === "ru"
            ? "Нет объектов для отчёта."
            : "No properties to report on yet."}
        </div>
      ) : (
        <>
          {/* KPI strip — same shape for single and multi; subtitles change
              to reflect the scope so a multi user understands "across
              N properties" while a single user sees "next 3 months". */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label={locale === "ru" ? "Ночей забронировано" : "Nights booked"}
              value={aggregate.nights}
              subtitle={isMulti
                ? (locale === "ru" ? `на ${properties.length} объект.` : `across ${properties.length}`)
                : (locale === "ru" ? "в горизонте отчёта" : "in horizon")}
              accent
            />
            <KpiCard
              label={locale === "ru" ? "Заполняемость" : "Occupancy"}
              value={`${aggregate.occupancy}%`}
              subtitle={isMulti
                ? (locale === "ru" ? "взвешенная по объектам" : "weighted across portfolio")
                : (locale === "ru" ? "ночей / дней горизонта" : "nights / horizon days")}
            />
            <KpiCard
              label={locale === "ru" ? "Бронирований" : "Bookings"}
              value={aggregate.bookings}
              subtitle={
                aggregate.avgStay > 0
                  ? (locale === "ru" ? `средн. ${aggregate.avgStay} ноч.` : `avg ${aggregate.avgStay} nights`)
                  : undefined
              }
            />
            <KpiCard
              label={locale === "ru" ? "Уборок" : "Cleanings"}
              value={aggregate.cleanings}
              subtitle={locale === "ru" ? "после выезда гостей" : "one per checkout"}
            />
          </div>

          {/* Top-platform chip — readable hint above the chart. */}
          {aggregate.topPlatform && aggregate.nights > 0 && (
            <div className="flex items-center gap-2 text-xs text-[var(--ink-3)]">
              <span>{locale === "ru" ? "Главный источник:" : "Top source:"}</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                style={{ backgroundColor: aggregate.topPlatform.color }}
              >
                {aggregate.topPlatform.label}
              </span>
            </div>
          )}

          {/* Chart — stacked bars, theme-aware. CartesianGrid + axis
              text use `currentColor` so the parent text color sets the
              tone for both light and dark themes. */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4 text-[var(--ink-3)]">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.16} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "currentColor", fontSize: 11 }}
                    axisLine={{ stroke: "currentColor", strokeOpacity: 0.18 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "currentColor", fontSize: 11 }}
                    axisLine={{ stroke: "currentColor", strokeOpacity: 0.18 }}
                    tickLine={false}
                    unit={locale === "ru" ? "д" : "d"}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--m-accent)", fillOpacity: 0.06 }}
                    contentStyle={{
                      background: "var(--bg)",
                      border: "1px solid var(--line-2)",
                      borderRadius: 10,
                      color: "var(--ink)",
                      fontSize: 12,
                      boxShadow: "0 4px 16px -8px rgba(0,0,0,0.18)",
                    }}
                    itemStyle={{ color: "var(--ink)" }}
                    labelStyle={{ color: "var(--ink-3)", fontWeight: 500 }}
                    formatter={(value, name) => {
                      const meta = activePlatforms.find((p) => p.slug === name);
                      const label = meta?.label ?? String(name);
                      const unit = locale === "ru" ? "ноч." : "nights";
                      return [`${value} ${unit}`, label];
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={28}
                    iconType="square"
                    wrapperStyle={{ fontSize: 11, color: "var(--ink-3)" }}
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
                      radius={idx === activePlatforms.length - 1 ? [4, 4, 0, 0] : 0}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            {noData && (
              <p className="mt-2 text-center text-xs text-[var(--ink-4)]">
                {locale === "ru"
                  ? "Нет бронирований в ближайшие месяцы."
                  : "No bookings in the upcoming months."}
              </p>
            )}
            {loading && (
              <p className="mt-2 text-center text-xs text-[var(--ink-4)]">
                {locale === "ru" ? "Загрузка…" : "Loading…"}
              </p>
            )}
          </div>

          {/* Per-property summary — only meaningful in multi-property
              mode. Sortable would be nice, default sort is nights desc
              so the busiest property surfaces first. */}
          {isMulti && propertyKpis.length > 0 && (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] overflow-hidden">
              <div className="border-b border-[var(--line)] px-4 py-3">
                <h2 className="text-sm font-semibold text-[var(--ink)]">
                  {locale === "ru" ? "По объектам" : "By property"}
                </h2>
                <p className="mt-0.5 text-[11px] text-[var(--ink-4)]">
                  {locale === "ru"
                    ? "Кликните по объекту, чтобы открыть его отчёт."
                    : "Click a property to open its scoped report."}
                </p>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--line)] text-[10px] uppercase tracking-wider text-[var(--ink-4)]">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">{locale === "ru" ? "Объект" : "Property"}</th>
                    <th className="px-4 py-2 text-right font-medium">{locale === "ru" ? "Ночей" : "Nights"}</th>
                    <th className="px-4 py-2 text-right font-medium">{locale === "ru" ? "Заполн." : "Occ."}</th>
                    <th className="px-4 py-2 text-right font-medium">{locale === "ru" ? "Брон." : "Bookings"}</th>
                    <th className="px-4 py-2 text-right font-medium">{locale === "ru" ? "Уборок" : "Cleanings"}</th>
                    <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">{locale === "ru" ? "Источник" : "Top source"}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...propertyKpis]
                    .sort((a, b) => b.nights - a.nights)
                    .map((k) => (
                      <tr key={k.property.id} className="border-b border-[var(--line)]/50 last:border-0 hover:bg-[var(--bg-3)]">
                        <td className="px-4 py-2.5 text-[var(--ink)] font-medium">
                          <Link href={`/dashboard?property=${k.property.id}&view=reports`} className="hover:underline">
                            {k.property.name}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-right text-[var(--ink-2)] tabular-nums">{k.nights}</td>
                        <td className="px-4 py-2.5 text-right text-[var(--ink-2)] tabular-nums">{k.occupancy}%</td>
                        <td className="px-4 py-2.5 text-right text-[var(--ink-2)] tabular-nums">{k.bookings}</td>
                        <td className="px-4 py-2.5 text-right text-[var(--ink-2)] tabular-nums">{k.cleanings}</td>
                        <td className="px-4 py-2.5 hidden sm:table-cell">
                          {k.topPlatform ? (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                              style={{ backgroundColor: k.topPlatform.color }}
                            >
                              {k.topPlatform.label}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--ink-4)]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Reservations CSV export — auto-scoped to the header selection.
          When a property is picked, only its reservations export; on
          dashboard view (no property), all accessible reservations
          export. The old "All / Selected" dropdown was confusing
          because it conflicted with the header selector. */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4">
        <h2 className="mb-1 text-sm font-semibold text-[var(--ink)]">
          {locale === "ru" ? "Экспорт броней (CSV)" : "Export reservations (CSV)"}
        </h2>
        <p className="mb-3 text-[11px] text-[var(--ink-4)]">
          {property
            ? (locale === "ru"
                ? `Будет выгружен ${property.name}.`
                : `Exporting ${property.name}.`)
            : (locale === "ru"
                ? `Будут выгружены все ${properties.length} объекта.`
                : `Exporting all ${properties.length} ${properties.length === 1 ? "property" : "properties"}.`)}
        </p>
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
          <button
            onClick={downloadCsv}
            disabled={targetProperties.length === 0}
            className="ml-auto h-8 rounded-md bg-[var(--m-accent)] px-3 text-xs font-medium text-white hover:bg-[var(--m-accent-2)] disabled:opacity-40"
          >
            {locale === "ru" ? "Скачать CSV" : "Download CSV"}
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
