"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { PropertySwitcher } from "@/components/property-switcher";
import { useI18n } from "@/lib/i18n/context";
import type { Property } from "@/lib/types";

// Bundled platform presets — kept inline rather than imported from
// @/lib/platforms because that module's lazy `import("@/lib/prisma")`
// gets traced into the client bundle by Turbopack and breaks the
// build (prisma uses node:module).
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
  property: Property | null;
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
  isPast: boolean;
  isCurrent: boolean;
  /** Per-platform occupancy: platform slug -> nights occupied in this month. */
  perPlatform: Record<string, number>;
}

type PeriodChoice = 3 | 6 | 12 | 24 | "all";
const DEFAULT_PERIOD: PeriodChoice = 6;
const FUTURE_MONTHS = 6; // forward window for upcoming nights

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
 * Build a [past N months · current · next FUTURE_MONTHS months] window
 * of buckets, trimmed at the edges to whatever data actually exists.
 * `pastMonths === "all"` skips the past cap entirely so every historical
 * stay in the DB renders. The forward edge always extends as far as the
 * latest upcoming stay (capped at +12 mo so an outlier booking 3 years
 * out doesn't squish the chart).
 */
function buildMonthRange(stays: NormalizedStay[], pastMonths: PeriodChoice): MonthBucket[] {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Start: the earliest stay's month, clamped to `pastMonths` back
  // (or no clamp at all in "all" mode).
  let earliestMonth = currentMonthStart;
  for (const s of stays) {
    const d = new Date(s.start + "T00:00:00");
    if (d < earliestMonth) earliestMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  }
  let start: Date;
  if (pastMonths === "all") {
    start = earliestMonth;
  } else {
    const startCap = new Date(currentMonthStart);
    startCap.setMonth(startCap.getMonth() - pastMonths);
    start = earliestMonth < startCap ? startCap : earliestMonth;
  }

  // End: latest stay's month + 1, clamped to FUTURE_MONTHS forward
  // (with a hard 12-month forward cap so an outlier doesn't blow up).
  const endCap = new Date(currentMonthStart);
  endCap.setMonth(endCap.getMonth() + FUTURE_MONTHS);
  let latestMonth = endCap;
  for (const s of stays) {
    const d = new Date(s.end + "T00:00:00");
    if (d > latestMonth) latestMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  }
  const hardCap = new Date(currentMonthStart);
  hardCap.setMonth(hardCap.getMonth() + 12);
  const end = latestMonth > hardCap ? hardCap : latestMonth;

  const buckets: MonthBucket[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    const year = cursor.getFullYear();
    const monthIndex = cursor.getMonth();
    const monthEnd = new Date(year, monthIndex + 1, 0); // last day of month
    const totalDays = monthEnd.getDate();
    const isPast = monthEnd < today;
    const isCurrent =
      year === currentMonthStart.getFullYear() && monthIndex === currentMonthStart.getMonth();
    buckets.push({
      key: ymKey(year, monthIndex),
      label: cursor.toLocaleDateString("en-GB", {
        month: "short",
        // Show year on Jan and on the very first bucket so cross-year context is visible.
        year: monthIndex === 0 || buckets.length === 0 ? "2-digit" : undefined,
      }),
      year,
      monthIndex,
      totalDays,
      isPast,
      isCurrent,
      perPlatform: {},
    });
    cursor.setMonth(monthIndex + 1, 1);
  }
  return buckets;
}

/** Distribute each stay's occupied days across the month buckets. */
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

/** True for iCal summaries that indicate a generic blocked entry
 *  rather than a guest name (Airbnb's "Reserved", Booking's "CLOSED",
 *  host-blocks, etc.). Used to merge iCal twins of manually-entered
 *  Reservations on identical dates when the host hasn't gone through
 *  the bar-claim popover. */
function isGenericIcalName(summary: string): boolean {
  if (!summary) return true;
  const s = summary.toLowerCase().trim();
  return (
    s === "reserved" ||
    s === "closed" ||
    s.includes("not available") ||
    s.includes("blocked") ||
    s.includes("closed - not available")
  );
}

/** Build the deduped list of stays for one property. Three layers of
 *  dedup so the same real-world booking is never counted twice:
 *    1. linkedEventUid match (explicit claim) → drop the iCal twin.
 *    2. Same start+end + generic iCal summary → drop the iCal twin
 *       (catches manually-entered Reservations whose iCal feed is
 *       still emitting an unclaimed twin).
 *    3. Airbnb host-blocks → filtered out (not real guests). */
function buildStaysForProperty(prop: Property, events: CalendarEventRow[]): NormalizedStay[] {
  const linkedUids = new Set(
    prop.reservations.map((r) => r.linkedEventUid).filter((u): u is string => !!u)
  );
  const reservationDateKeys = new Set<string>();
  for (const r of prop.reservations) {
    reservationDateKeys.add(`${isoDate(new Date(r.checkIn))}|${isoDate(new Date(r.checkOut))}`);
  }
  const stays: NormalizedStay[] = [];
  for (const ev of events) {
    if (ev.propertyId !== prop.id) continue;
    const platform = (ev.platform || "").toLowerCase();
    const isAirbnbBlock =
      platform === "airbnb" &&
      (ev.summary?.includes("Not available") || ev.summary?.includes("Blocked"));
    if (isAirbnbBlock) continue;
    if (ev.uid && linkedUids.has(ev.uid)) continue;
    const dateKey = `${ev.startDate}|${ev.endDate}`;
    if (reservationDateKeys.has(dateKey) && isGenericIcalName(ev.summary || "")) continue;
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

/**
 * Per-property KPIs split into past + upcoming. Past occupancy is the
 * only honest "occupancy %" because future months still have bookable
 * days — counting those toward occupancy makes it look artificially
 * low for properties that get last-minute bookings.
 */
interface PropertyKpis {
  property: Property;
  pastNights: number;
  pastDays: number;
  pastOccupancy: number;     // % of completed past months that were occupied
  upcomingNights: number;    // raw nights booked in next FUTURE_MONTHS months
  totalBookings: number;     // count of stays touching the displayed window
  pastBookings: number;      // count of stays that ended in the past window
  avgStayNights: number;
  topPlatform: PlatformMeta | null;
  cleaningsUpcoming: number;
}

function computePropertyKpis(
  prop: Property,
  stays: NormalizedStay[],
  buckets: MonthBucket[],
): PropertyKpis {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const futureEndCap = new Date(now.getFullYear(), now.getMonth() + FUTURE_MONTHS + 1, 1);

  // Past horizon = first past bucket → end of the month before this one.
  const pastBuckets = buckets.filter((b) => b.isPast && stays.some((s) => s.propertyId === prop.id));
  // Past day total = sum of days in past months that are fully done.
  const pastStart = pastBuckets[0]
    ? new Date(pastBuckets[0].year, pastBuckets[0].monthIndex, 1)
    : currentMonthStart;
  const pastEnd = currentMonthStart; // exclusive (today's month is "current", not past)
  const pastDays = Math.round((pastEnd.getTime() - pastStart.getTime()) / 86_400_000);

  let pastNights = 0;
  let upcomingNights = 0;
  let totalBookings = 0;
  let pastBookings = 0;
  let totalNightsAllTime = 0;
  let cleaningsUpcoming = 0;
  const perPlatform = new Map<string, number>();

  for (const s of stays) {
    if (s.propertyId !== prop.id) continue;
    const sStart = new Date(s.start + "T00:00:00");
    const sEnd = new Date(s.end + "T00:00:00");

    // Past portion of stay: clipped to [pastStart, pastEnd)
    const pStart = new Date(Math.max(sStart.getTime(), pastStart.getTime()));
    const pStop = new Date(Math.min(sEnd.getTime(), pastEnd.getTime()));
    if (pStop > pStart) {
      pastNights += Math.round((pStop.getTime() - pStart.getTime()) / 86_400_000);
    }

    // Upcoming portion: clipped to [today, futureEndCap)
    const uStart = new Date(Math.max(sStart.getTime(), today.getTime()));
    const uStop = new Date(Math.min(sEnd.getTime(), futureEndCap.getTime()));
    if (uStop > uStart) {
      upcomingNights += Math.round((uStop.getTime() - uStart.getTime()) / 86_400_000);
    }

    // Total stay length toward avg-stay calculation (uses the WHOLE stay,
    // not just the part that fits the report window — a stay either is
    // a stay or it isn't).
    const stayNights = Math.max(0, Math.round((sEnd.getTime() - sStart.getTime()) / 86_400_000));
    if (stayNights > 0) {
      totalBookings += 1;
      totalNightsAllTime += stayNights;
      perPlatform.set(s.platform, (perPlatform.get(s.platform) ?? 0) + stayNights);
      if (sEnd <= today) pastBookings += 1;
      // Cleanings upcoming = stays whose checkout falls inside the
      // forward window. One cleaning per checkout.
      if (sEnd > today && sEnd <= futureEndCap) cleaningsUpcoming += 1;
    }
  }

  const pastOccupancy = pastDays > 0 ? Math.round((100 * pastNights) / pastDays) : 0;
  const avgStayNights =
    totalBookings > 0 ? Math.round((totalNightsAllTime / totalBookings) * 10) / 10 : 0;

  let topPlatform: PlatformMeta | null = null;
  let topNights = 0;
  for (const [slug, n] of perPlatform) {
    if (n > topNights) {
      topNights = n;
      topPlatform = platformMeta(slug);
    }
  }

  return {
    property: prop,
    pastNights,
    pastDays,
    pastOccupancy,
    upcomingNights,
    totalBookings,
    pastBookings,
    avgStayNights,
    topPlatform,
    cleaningsUpcoming,
  };
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
  const [periodMonths, setPeriodMonths] = useState<PeriodChoice>(DEFAULT_PERIOD);
  const abortRef = useRef<AbortController | null>(null);

  const targetProperties = useMemo(
    () => (property ? [property] : properties),
    [property, properties],
  );
  const isMulti = !property;
  const targetIdsKey = useMemo(
    () => targetProperties.map((p) => p.id).sort((a, b) => a - b).join(","),
    [targetProperties],
  );

  useEffect(() => {
    if (targetProperties.length === 0) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate fetch-on-prop-change pattern; loading state must flip on the same render that kicks off the request
    setLoading(true);
    const url = property
      ? `/api/calendar/sync?propertyId=${property.id}&limit=2000`
      : `/api/calendar/sync?limit=5000`;
    fetch(url, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setEvents(Array.isArray(data.events) ? data.events : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [property, targetIdsKey, targetProperties.length]);

  const allStays: NormalizedStay[] = useMemo(() => {
    const out: NormalizedStay[] = [];
    for (const p of targetProperties) {
      out.push(...buildStaysForProperty(p, events));
    }
    return out;
  }, [targetProperties, events]);

  const buckets = useMemo(() => {
    const b = buildMonthRange(allStays, periodMonths);
    fillBuckets(b, allStays);
    return b;
  }, [allStays, periodMonths]);

  const propertyKpis: PropertyKpis[] = useMemo(() => {
    return targetProperties.map((p) => computePropertyKpis(p, allStays, buckets));
  }, [targetProperties, allStays, buckets]);

  const aggregate = useMemo(() => {
    let pastNights = 0;
    let pastDays = 0;
    let upcomingNights = 0;
    let totalBookings = 0;
    let pastBookings = 0;
    let cleaningsUpcoming = 0;
    let totalNightsAllTime = 0;
    const perPlatform = new Map<string, number>();
    for (const k of propertyKpis) {
      pastNights += k.pastNights;
      pastDays += k.pastDays;
      upcomingNights += k.upcomingNights;
      totalBookings += k.totalBookings;
      pastBookings += k.pastBookings;
      cleaningsUpcoming += k.cleaningsUpcoming;
      totalNightsAllTime += k.avgStayNights * k.totalBookings;
    }
    // Per-platform totals derived from the VISIBLE buckets only. This
    // keeps the "Top source" pill consistent with what the user is
    // looking at — if the window is "Last 3 months" the source pill
    // reflects the 3-month winner, not all-time. Earlier the aggregate
    // used `allStays` (all-time) and the pill said "Booking" while the
    // chart only showed Airbnb because the user's Booking history fell
    // outside the visible window.
    for (const b of buckets) {
      for (const [slug, n] of Object.entries(b.perPlatform)) {
        perPlatform.set(slug, (perPlatform.get(slug) ?? 0) + n);
      }
    }
    const pastOccupancy = pastDays > 0 ? Math.round((100 * pastNights) / pastDays) : 0;
    const avgStayNights =
      totalBookings > 0 ? Math.round((totalNightsAllTime / totalBookings) * 10) / 10 : 0;
    let topPlatform: PlatformMeta | null = null;
    let topNights = 0;
    for (const [slug, n] of perPlatform) {
      if (n > topNights) {
        topNights = n;
        topPlatform = platformMeta(slug);
      }
    }
    return {
      pastNights,
      pastDays,
      pastOccupancy,
      upcomingNights,
      totalBookings,
      pastBookings,
      cleaningsUpcoming,
      avgStayNights,
      topPlatform,
    };
  }, [propertyKpis, buckets]);

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
        const row: Record<string, string | number | boolean> = {
          label: b.label,
          isPast: b.isPast,
          isCurrent: b.isCurrent,
          totalDays: b.totalDays,
        };
        for (const platform of activePlatforms) {
          row[platform.slug] = b.perPlatform[platform.slug] ?? 0;
        }
        return row;
      }),
    [buckets, activePlatforms],
  );

  // Auto y-axis: round up to next multiple of 5 above the busiest month
  // OR cap at typical max-month-days for visual stability.
  const yAxisMax = useMemo(() => {
    let maxNights = 0;
    for (const b of buckets) {
      const sum = Object.values(b.perPlatform).reduce((a, n) => a + n, 0);
      if (sum > maxNights) maxNights = sum;
    }
    const baseline = isMulti ? targetProperties.length * 31 : 31;
    // Don't shrink below the natural single-property month length so
    // the visual scale stays comparable across months. Round up to the
    // nearest 5 above the actual peak so labels read cleanly.
    return Math.max(baseline, Math.ceil((maxNights + 2) / 5) * 5);
  }, [buckets, isMulti, targetProperties.length]);

  const downloadCsv = () => {
    const params = new URLSearchParams();
    if (exportFrom) params.set("from", exportFrom);
    if (exportTo) params.set("to", exportTo);
    if (property) params.set("propertyId", String(property.id));
    const qs = params.toString();
    window.location.href = `/api/reservations/export${qs ? `?${qs}` : ""}`;
  };

  // Today's column — used by ReferenceLine to show the "now" boundary.
  const currentBucketLabel = useMemo(() => {
    const now = new Date();
    const key = ymKey(now.getFullYear(), now.getMonth());
    return buckets.find((b) => b.key === key)?.label ?? null;
  }, [buckets]);

  const headerSubtitle = isMulti
    ? (locale === "ru"
        ? `Сводка по ${properties.length} объектам — прошлое + ближайшие месяцы`
        : `Portfolio across ${properties.length} ${properties.length === 1 ? "property" : "properties"} — history + upcoming`)
    : (locale === "ru"
        ? `${property!.name} — история и план`
        : `${property!.name} — history & pipeline`);

  const pastWindowLabel = useMemo(() => {
    const pastBuckets = buckets.filter((b) => b.isPast);
    if (pastBuckets.length === 0) return locale === "ru" ? "нет данных" : "no data yet";
    const months = pastBuckets.length;
    return locale === "ru"
      ? `${months} ${months === 1 ? "мес." : "мес."} назад`
      : `last ${months} ${months === 1 ? "month" : "months"}`;
  }, [buckets, locale]);

  const noData = !loading && targetProperties.length > 0 && aggregate.totalBookings === 0;

  return (
    /* Calendar / cleaning-style two-column shell. Negative side margins
       escape the dashboard's <main> padding so the content lines up
       1:1 with the header; the inner max-w-[1760px] mx-auto matches
       the calendar exactly. */
    <div className="-mx-3 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[1760px] px-3 sm:px-5 flex flex-col lg:flex-row gap-6">
        <div className="min-w-0 lg:flex-1 space-y-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">
              {locale === "ru" ? "Отчёты" : "Reports"}
            </h1>
            <p className="mt-1 text-xs text-[var(--ink-3)]">{headerSubtitle}</p>
          </div>

          {targetProperties.length === 0 ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-6 text-center text-xs text-[var(--ink-4)]">
              {locale === "ru" ? "Нет объектов для отчёта." : "No properties to report on yet."}
            </div>
          ) : (
            <>
              {/* KPI strip — past-based occupancy is the only honest %;
                  upcoming is shown as raw nights so it doesn't get
                  conflated with "we're 30% full forever" anxiety. */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiCard
                  label={locale === "ru" ? "Заполняемость" : "Past occupancy"}
                  value={`${aggregate.pastOccupancy}%`}
                  subtitle={pastWindowLabel}
                  accent
                />
                <KpiCard
                  label={locale === "ru" ? "Ночей вперёд" : "Upcoming nights"}
                  value={aggregate.upcomingNights}
                  subtitle={locale === "ru" ? `на ${FUTURE_MONTHS} мес.` : `next ${FUTURE_MONTHS} mo.`}
                />
                <KpiCard
                  label={locale === "ru" ? "Бронирований" : "Bookings"}
                  value={aggregate.totalBookings}
                  subtitle={
                    aggregate.avgStayNights > 0
                      ? (locale === "ru" ? `средн. ${aggregate.avgStayNights} ноч.` : `avg ${aggregate.avgStayNights} nights`)
                      : (locale === "ru" ? "за весь период" : "all time")
                  }
                />
                <KpiCard
                  label={locale === "ru" ? "Уборок впереди" : "Cleanings ahead"}
                  value={aggregate.cleaningsUpcoming}
                  subtitle={locale === "ru" ? "после выезда гостей" : "one per upcoming checkout"}
                />
              </div>

              {/* Top-platform readout — colored pill matches calendar bars. */}
              {aggregate.topPlatform && (
                <div className="flex items-center gap-2 text-xs text-[var(--ink-3)]">
                  <span>{locale === "ru" ? "Главный источник:" : "Top source:"}</span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                    style={{ backgroundColor: aggregate.topPlatform.color }}
                  >
                    {aggregate.topPlatform.label}
                  </span>
                </div>
              )}

              {/* Chart — past months muted via opacity so the eye lands
                  on the actionable upcoming window. ReferenceLine marks
                  "now". Custom legend renders colored pills (the default
                  Recharts legend's "Booking #003580" text was illegible
                  on dark theme). */}
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4 text-[var(--ink-3)]">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs">
                  <span className="text-[var(--ink-3)]">
                    {locale === "ru"
                      ? `Ночи занятости по месяцам (макс. ${isMulti ? `${targetProperties.length} × 31` : 31})`
                      : `Nights occupied per month (max ${isMulti ? `${targetProperties.length} × 31` : 31})`}
                  </span>
                </div>
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
                        domain={[0, yAxisMax]}
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
                      {currentBucketLabel && (
                        <ReferenceLine
                          x={currentBucketLabel}
                          stroke="var(--m-accent)"
                          strokeOpacity={0.5}
                          strokeDasharray="4 4"
                          label={{
                            value: locale === "ru" ? "сейчас" : "now",
                            position: "top",
                            fill: "var(--m-accent)",
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        />
                      )}
                      {activePlatforms.map((p, idx) => (
                        <Bar
                          key={p.slug}
                          dataKey={p.slug}
                          stackId="src"
                          fill={p.color}
                          radius={idx === activePlatforms.length - 1 ? [4, 4, 0, 0] : 0}
                        >
                          {chartData.map((row, i) => (
                            <Cell
                              key={`c-${i}-${p.slug}`}
                              fillOpacity={row.isPast ? 0.55 : 1}
                            />
                          ))}
                        </Bar>
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom legend — colored pills with white text, padded
                    enough to read against any theme. Replaces Recharts'
                    default tiny-square + neutral-text legend that hid
                    Booking's #003580 against dark backgrounds. */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {activePlatforms.map((p) => (
                    <span
                      key={p.slug}
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.label}
                    </span>
                  ))}
                  {/* Past/upcoming legend swatch */}
                  {buckets.some((b) => b.isPast) && (
                    <>
                      <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-3)] px-2 py-0.5 text-[11px] text-[var(--ink-3)]">
                        <span className="inline-block h-2 w-3 rounded-sm bg-[var(--ink-3)]/55" />
                        {locale === "ru" ? "прошедшие" : "past"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-3)] px-2 py-0.5 text-[11px] text-[var(--ink-3)]">
                        <span className="inline-block h-2 w-3 rounded-sm bg-[var(--ink-3)]" />
                        {locale === "ru" ? "впереди" : "upcoming"}
                      </span>
                    </>
                  )}
                </div>

                {noData && (
                  <p className="mt-3 text-center text-xs text-[var(--ink-4)]">
                    {locale === "ru" ? "Бронирований пока нет." : "No bookings yet."}
                  </p>
                )}
                {loading && (
                  <p className="mt-3 text-center text-xs text-[var(--ink-4)]">
                    {locale === "ru" ? "Загрузка…" : "Loading…"}
                  </p>
                )}
              </div>

              {/* Per-property summary — only meaningful in multi-property
                  mode. Sorted by past occupancy desc so the busiest
                  property surfaces first; click-through scopes to that
                  property's report. */}
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
                        <th className="px-4 py-2 text-right font-medium">{locale === "ru" ? "Заполн." : "Past occ."}</th>
                        <th className="px-4 py-2 text-right font-medium">{locale === "ru" ? "Впереди" : "Upcoming"}</th>
                        <th className="px-4 py-2 text-right font-medium">{locale === "ru" ? "Брон." : "Bookings"}</th>
                        <th className="px-4 py-2 text-right font-medium">{locale === "ru" ? "Уборок" : "Cleanings"}</th>
                        <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">{locale === "ru" ? "Источник" : "Top source"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...propertyKpis]
                        .sort((a, b) => b.pastOccupancy - a.pastOccupancy)
                        .map((k) => (
                          <tr key={k.property.id} className="border-b border-[var(--line)]/50 last:border-0 hover:bg-[var(--bg-3)]">
                            <td className="px-4 py-2.5 text-[var(--ink)] font-medium">
                              <Link href={`/dashboard?property=${k.property.id}&view=reports`} className="hover:underline">
                                {k.property.name}
                              </Link>
                            </td>
                            <td className="px-4 py-2.5 text-right text-[var(--ink-2)] tabular-nums">{k.pastOccupancy}%</td>
                            <td className="px-4 py-2.5 text-right text-[var(--ink-2)] tabular-nums">{k.upcomingNights}</td>
                            <td className="px-4 py-2.5 text-right text-[var(--ink-2)] tabular-nums">{k.totalBookings}</td>
                            <td className="px-4 py-2.5 text-right text-[var(--ink-2)] tabular-nums">{k.cleaningsUpcoming}</td>
                            <td className="px-4 py-2.5 hidden sm:table-cell">
                              {k.topPlatform ? (
                                <span
                                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
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
        </div>

        {/* Sidebar — same shape as the calendar / cleaning sidebars.
            Borderless rounded panel with a soft shadow; lg:top-3 for
            breathing room from the global header. */}
        <aside className="w-full lg:w-[360px] lg:shrink-0 lg:sticky lg:top-3 lg:self-start lg:max-h-[calc(100vh-84px)] rounded-2xl bg-[var(--bg)] shadow-[0_1px_3px_-1px_rgba(0,0,0,0.04),0_4px_16px_-8px_rgba(0,0,0,0.06)] [overflow:clip]">
          <div className="border-b border-[var(--line)] px-5 py-4 space-y-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--ink-4)]">
                {locale === "ru" ? "Отчёты" : "Reports"}
              </div>
              <div className="mt-0.5 text-base font-semibold text-[var(--ink)] truncate">
                {property
                  ? property.name
                  : (locale === "ru"
                      ? `Все объекты (${properties.length})`
                      : `All properties (${properties.length})`)}
              </div>
            </div>
            <PropertySwitcher
              properties={properties}
              selectedPropertyId={property?.id ?? null}
              view="reports"
              showAllOption
              label={null}
            />
          </div>

          {/* Period selector — controls the past-window of the chart
              and every KPI that depends on it. Default 6 months back +
              6 forward (the original window). "All" stretches back to
              the earliest stay in the DB so historical-only data
              becomes visible — needed because past stays in iCal feeds
              age out, and once they do, the only way to see them is to
              widen the past window of our own DB snapshot. */}
          <div className="border-b border-[var(--line)] px-5 py-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)] mb-2">
              {locale === "ru" ? "Период" : "Period"}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {([3, 6, 12, 24, "all"] as PeriodChoice[]).map((p) => {
                const active = periodMonths === p;
                const label = p === "all"
                  ? (locale === "ru" ? "Все" : "All")
                  : (locale === "ru" ? `${p}м` : `${p}M`);
                return (
                  <button
                    key={String(p)}
                    type="button"
                    onClick={() => setPeriodMonths(p)}
                    className={`h-8 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? "bg-[var(--m-accent)] text-white"
                        : "bg-[var(--bg-2)] text-[var(--ink-2)] hover:bg-[var(--bg-3)]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-[var(--ink-4)] leading-relaxed">
              {locale === "ru"
                ? "Прошлые месяцы + 6 месяцев вперёд. «Все» — с самой ранней брони."
                : "Past window + next 6 months. \"All\" extends back to your earliest stay."}
            </p>
          </div>

          <div className="px-5 py-4 space-y-3">
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
              {locale === "ru" ? "Экспорт броней" : "Export reservations"}
            </div>
            <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
              {property
                ? (locale === "ru" ? `Будет выгружен ${property.name}.` : `Exporting ${property.name}.`)
                : (locale === "ru"
                    ? `Все ${properties.length} объекта.`
                    : `All ${properties.length} ${properties.length === 1 ? "property" : "properties"}.`)}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-[var(--ink-4)]">
                  {locale === "ru" ? "С" : "From"}
                </label>
                <input
                  type="date"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
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
                  className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                />
              </div>
            </div>
            <button
              onClick={downloadCsv}
              disabled={targetProperties.length === 0}
              className="h-9 w-full rounded-md bg-[var(--m-accent)] px-3 text-sm font-medium text-white hover:bg-[var(--m-accent-2)] disabled:opacity-40 transition-colors"
            >
              {locale === "ru" ? "Скачать CSV" : "Download CSV"}
            </button>
            <p className="text-[11px] text-[var(--ink-4)] leading-relaxed">
              {locale === "ru"
                ? "Пустые поля = выгрузить все. UTF-8 BOM для Excel."
                : "Leave dates blank to export everything. UTF-8 BOM for Excel."}
            </p>
          </div>

          {/* Notes about data sources — surfaces the reality that iCal
              feeds prune past stays, so historical numbers improve over
              time as the DB accumulates its own snapshot. */}
          <div className="border-t border-[var(--line)] px-5 py-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)] mb-1.5">
              {locale === "ru" ? "Источники данных" : "Data sources"}
            </div>
            <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
              {locale === "ru"
                ? "Цифры считаются из ваших броней + iCal событий, дедуплицированных по uid. Прошлые брони сохраняются в нашей БД, даже если платформы убрали их из своих фидов."
                : "Numbers are computed from your reservations + iCal events, deduped by uid. Past stays are preserved in our DB even after platforms drop them from their feeds."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
