"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { DateSlider } from "@/components/date-slider";
import { CleaningSchedule } from "@/components/cleaning-schedule";
import { WelcomeModal } from "@/components/welcome-modal";
import { useI18n } from "@/lib/i18n/context";
import type { Property, CalendarLink, DateOverride } from "@/lib/types";

// RT-25.6 tick 2 — bundled platform presets, kept inline rather than
// imported from @/lib/platforms because that module's lazy
// `import("@/lib/prisma")` gets traced into the client bundle by
// Turbopack and breaks the build (matches the reports-panel.tsx
// approach landed in RT-25.5 / commit bd37271). Slugs and colors mirror
// the seed in prisma/push-schema.ts so the form pills match the
// calendar bars exactly.
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

const PRESET_BY_SLUG = new Map(PLATFORM_PRESETS.map((p) => [p.slug, p]));

function platformDisplayName(slug: string): string {
  return PRESET_BY_SLUG.get(slug)?.displayName ?? slug;
}

function platformColor(slug: string): string {
  return PRESET_BY_SLUG.get(slug)?.color ?? FALLBACK_PLATFORM_COLOR;
}

interface CalendarEvent {
  id: number;
  platform: string;
  summary: string;
  startDate: string;
  endDate: string;
}

interface DashboardProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (id: number) => void;
  onSelectReservation: (id: number) => void;
  onAddReservation: (data: {
    name: string;
    checkIn: string;
    checkOut: string;
    platform: string;
    propertyId: number;
  }) => void;
  onAddProperty?: (name: string) => Promise<void> | void;
}

export function Dashboard({
  properties,
  selectedProperty,
  onSelectProperty,
  onSelectReservation,
  onAddReservation,
  onAddProperty,
}: DashboardProps) {
  const { t, locale } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPropertyId, setFormPropertyId] = useState<number | "">(
    selectedProperty?.id || (properties.length > 0 ? properties[0].id : "")
  );
  const [formPlatform, setFormPlatform] = useState("airbnb");
  const [formCheckIn, setFormCheckIn] = useState("");
  const [formCheckOut, setFormCheckOut] = useState("");
  const [allSyncedEvents, setAllSyncedEvents] = useState<Record<number, CalendarEvent[]>>({});
  const [allLinks, setAllLinks] = useState<Record<number, CalendarLink[]>>({});
  const [allOverrides, setAllOverrides] = useState<Record<number, DateOverride[]>>({});
  const [loadingCalendarData, setLoadingCalendarData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // RT-25.6 tick 2 — distinct platform slugs across the user's CalendarLinks.
  // Populated regardless of selectedProperty so the form pills always reflect
  // the user's real platform set (Airbnb + Booking + any custom platforms).
  const [linkedPlatformSlugs, setLinkedPlatformSlugs] = useState<string[]>([]);

  // Fetch synced events, links, and overrides for all properties (for cleaning schedule)
  const fetchAllCalendarData = useCallback(async () => {
    if (selectedProperty || properties.length === 0) return;
    setLoadingCalendarData(true);
    try {
      const results = await Promise.all(
        properties.map(async (p) => {
          const [syncRes, linksRes, ovRes] = await Promise.all([
            fetch(`/api/calendar/sync?propertyId=${p.id}&limit=200`).then(r => r.json()),
            fetch(`/api/calendar/links?propertyId=${p.id}`).then(r => r.json()),
            fetch(`/api/date-overrides?propertyId=${p.id}`).then(r => r.json()),
          ]);
          return { id: p.id, events: syncRes.events || [], links: linksRes || [], overrides: ovRes || [] };
        })
      ).catch(() => []);
      const evMap: Record<number, CalendarEvent[]> = {};
      const lnMap: Record<number, CalendarLink[]> = {};
      const ovMap: Record<number, DateOverride[]> = {};
      for (const r of results) {
        evMap[r.id] = r.events;
        lnMap[r.id] = r.links;
        ovMap[r.id] = r.overrides;
      }
      setAllSyncedEvents(evMap);
      setAllLinks(lnMap);
      setAllOverrides(ovMap);
    } finally {
      setLoadingCalendarData(false);
    }
  }, [properties, selectedProperty]);

  useEffect(() => {
    fetchAllCalendarData();
  }, [fetchAllCalendarData]);

  // RT-25.6 tick 2 — fetch the user's full link inventory once on mount
  // (single call, no per-property fan-out) so the platform pills are
  // accurate even in per-property mode where fetchAllCalendarData
  // early-exits.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/calendar/links`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: CalendarLink[]) => {
        if (cancelled || !Array.isArray(rows)) return;
        const slugs = Array.from(new Set(rows.map((r) => r.platform).filter(Boolean)));
        setLinkedPlatformSlugs(slugs);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Platform pills shown in the Add-Reservation form. Order:
  //   1. Slugs the user has linked (in PLATFORM_PRESETS sort order, then alpha)
  //   2. "direct" — always offered as the manual-add channel
  // If the user has no links yet, fall back to airbnb + booking + direct
  // so a brand-new account doesn't see an empty toggle.
  const formPlatformOptions = useMemo<string[]>(() => {
    const linked = linkedPlatformSlugs.length > 0 ? linkedPlatformSlugs : ["airbnb", "booking"];
    const ordered: string[] = [];
    for (const preset of PLATFORM_PRESETS) {
      if (preset.slug === "direct") continue;
      if (linked.includes(preset.slug)) ordered.push(preset.slug);
    }
    // Custom slugs that aren't in the bundled presets: tail in alpha order.
    const known = new Set(PLATFORM_PRESETS.map((p) => p.slug));
    for (const slug of [...linked].sort()) {
      if (!known.has(slug)) ordered.push(slug);
    }
    ordered.push("direct");
    return ordered;
  }, [linkedPlatformSlugs]);

  // Keep formPlatform in the available set; if it drops out (rare —
  // user removed the only link of that type), reset to the first option.
  useEffect(() => {
    if (formPlatformOptions.length === 0) return;
    if (!formPlatformOptions.includes(formPlatform)) {
      setFormPlatform(formPlatformOptions[0]);
    }
  }, [formPlatformOptions, formPlatform]);

  useEffect(() => {
    if (selectedProperty) {
      setFormPropertyId(selectedProperty.id);
    }
  }, [selectedProperty]);

  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!selectedProperty && properties.length === 0 && onAddProperty) {
      const dismissed = localStorage.getItem("welcome-modal-dismissed") === "1";
      setShowWelcome(!dismissed);
    } else {
      setShowWelcome(false);
    }
  }, [selectedProperty, properties.length, onAddProperty]);

  // Per-property mode: keep the original "newest booking first" sort
  // (the per-property reservation list is more about audit-trail than
  // daily-ops planning). Global mode: sort upcoming-first so a returning
  // host sees what's happening today + this week at the top of the page.
  // RT-25.6 tick 3.
  const allReservations = selectedProperty
    ? selectedProperty.reservations
        .map((r) => ({ ...r, propertyName: selectedProperty.name, propertyId: selectedProperty.id }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : properties
        .flatMap((p) =>
          p.reservations.map((r) => ({
            ...r,
            propertyName: p.name,
            propertyId: p.id,
          }))
        );

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);
  const sevenDaysOutStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // Bucket the global-mode list. A reservation counts as "upcoming this
  // week" if today falls between checkIn and checkOut (active now) OR
  // checkIn is within the next 7 days. Past = already checked out.
  const { next7, later, past } = useMemo(() => {
    if (selectedProperty) {
      return { next7: [], later: [], past: [] as typeof allReservations };
    }
    const next7Bucket: typeof allReservations = [];
    const laterBucket: typeof allReservations = [];
    const pastBucket: typeof allReservations = [];
    for (const r of allReservations) {
      if (r.checkOut < todayStr) {
        pastBucket.push(r);
      } else if (r.checkIn < sevenDaysOutStr) {
        next7Bucket.push(r);
      } else {
        laterBucket.push(r);
      }
    }
    next7Bucket.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    laterBucket.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    pastBucket.sort((a, b) => b.checkOut.localeCompare(a.checkOut));
    return { next7: next7Bucket, later: laterBucket, past: pastBucket };
  }, [allReservations, selectedProperty, todayStr, sevenDaysOutStr]);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  // When searching, flatten all buckets and filter — sectioning only
  // makes sense for the daily-ops scan, not for "find a guest by name".
  // Per-property mode also stays flat (preserves prior behavior).
  const sortedFlat = useMemo(() => {
    if (selectedProperty) return allReservations;
    return [...next7, ...later, ...past];
  }, [selectedProperty, allReservations, next7, later, past]);

  const displayReservations = trimmedQuery
    ? sortedFlat.filter((r) => r.name.toLowerCase().includes(trimmedQuery))
    : sortedFlat;

  const [showPast, setShowPast] = useState(false);
  const useSections = !selectedProperty && !trimmedQuery && (next7.length + later.length + past.length) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCheckIn || !formCheckOut || !formPropertyId) return;
    onAddReservation({
      name: formName.trim(),
      checkIn: formCheckIn,
      checkOut: formCheckOut,
      platform: formPlatform,
      propertyId: Number(formPropertyId),
    });
    setFormName("");
    setFormCheckIn("");
    setFormCheckOut("");
    setShowForm(false);
  };

  const handleRowClick = (propertyId: number, reservationId: number) => {
    onSelectProperty(propertyId);
    setTimeout(() => onSelectReservation(reservationId), 50);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", { day: "2-digit", month: "short" });

  const dayCount = (checkIn: string, checkOut: string) => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const title = selectedProperty ? selectedProperty.name : t("dashboard.title");
  const resCount = displayReservations.length;
  const subtitle = selectedProperty
    ? `${resCount} ${locale === "ru" ? (resCount === 1 ? "бронирование" : resCount < 5 ? "бронирования" : "бронирований") : (resCount === 1 ? "reservation" : "reservations")}`
    : `${resCount} ${locale === "ru" ? "бронирований" : "reservations"} ${locale === "ru" ? "в" : "across"} ${properties.length} ${locale === "ru" ? (properties.length === 1 ? "объекте" : "объектах") : (properties.length === 1 ? "property" : "properties")}`;

  // RT-25.6 tick 4 — zero-properties first-screen. The Welcome modal
  // can be dismissed; once it is, the user previously landed on a
  // header + broken "+ New Reservation" button + "create a property"
  // empty list. Render a focused empty-state hero instead so the path
  // forward is unambiguous regardless of modal state.
  const isZeroProperties = !selectedProperty && properties.length === 0;
  const handleSampleProperty = useCallback(async () => {
    try {
      const res = await fetch("/api/properties/sample", { method: "POST" });
      if (res.ok) {
        window.location.reload();
        return;
      }
    } catch {}
    if (onAddProperty) await onAddProperty("Sample Apartment");
  }, [onAddProperty]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {onAddProperty && (
        <WelcomeModal
          open={showWelcome}
          onClose={() => setShowWelcome(false)}
          onAddProperty={onAddProperty}
        />
      )}
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--ink)]">
            {title}
            {loadingCalendarData && (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-[var(--line-2)] border-t-[#58a6ff]" />
            )}
          </h1>
          {!isZeroProperties && (
            <p className="mt-1 text-sm text-[var(--ink-4)]">{subtitle}</p>
          )}
        </div>
        {!isZeroProperties && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--m-accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("dashboard.newReservation")}
          </button>
        )}
      </div>

      {/* Zero-properties first-screen — short-circuits the rest of the
          dashboard so the user lands on a focused getting-started panel
          rather than a broken "+ New Reservation" button + an empty list.
          RT-25.6 tick 4. */}
      {isZeroProperties && onAddProperty && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-8 text-center sm:p-12">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--m-accent)]/15 text-[var(--m-accent)]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5l9-7.5 9 7.5M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">
            {t("dashboard.emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ink-3)]">
            {t("dashboard.emptyBody")}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            <button
              onClick={() => setShowWelcome(true)}
              className="h-10 w-full rounded-md bg-[var(--m-accent)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] sm:w-auto"
            >
              {t("dashboard.emptyAdd")}
            </button>
            <button
              onClick={handleSampleProperty}
              className="h-10 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--bg-3)] sm:w-auto"
            >
              {t("dashboard.emptySample")}
            </button>
          </div>
        </div>
      )}

      {/* Property cards (dashboard mode only) */}
      {!selectedProperty && properties.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map(p => {
            const futureRes = p.reservations.filter(r => new Date(r.checkOut) >= new Date());
            const nextRes = futureRes.sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())[0];
            return (
              <button
                key={p.id}
                onClick={() => onSelectProperty(p.id)}
                className="group rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-left transition-all hover:border-[var(--line-2)] hover:bg-[var(--bg-3)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--ink)] transition-colors">{p.name}</h3>
                  <svg className="h-4 w-4 text-[var(--ink-4)] group-hover:text-[var(--ink-4)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-[var(--ink-4)]">
                    <span>{futureRes.length} {locale === "ru" ? "бронир." : "bookings"}</span>
                    <span className="text-[var(--ink-4)]">·</span>
                    <span>{locale === "ru" ? "мин." : "min"} {p.minNights} {locale === "ru" ? "ноч." : "n"}</span>
                  </div>
                  {nextRes && (
                    <div className="text-xs text-[var(--ink-3)]">
                      <span className="text-[var(--ink-4)]">{locale === "ru" ? "Далее:" : "Next:"} </span>
                      <span className="font-medium text-[var(--ink-2)]">{nextRes.name}</span>
                      {" "}
                      <span>{formatDate(nextRes.checkIn)}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Quick Add Form */}
      {showForm && (
        <div className="rounded-lg border border-[var(--line-2)] bg-[var(--bg-2)] p-5">
          <h2 className="mb-4 text-sm font-medium text-[var(--ink)]">{t("dashboard.newReservation")}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--ink-3)]">{t("dashboard.property")}</label>
                <div className="relative">
                  <select
                    value={formPropertyId}
                    onChange={(e) => setFormPropertyId(Number(e.target.value))}
                    className="h-9 w-full appearance-none rounded-md border border-[var(--line-2)] bg-[var(--bg)] pl-3 pr-8 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                    required
                  >
                    <option value="" disabled>{t("dashboard.selectProperty")}</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[var(--ink-3)]">{t("dashboard.guestName")}</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t("dashboard.enterName")}
                  className="h-9 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] placeholder-[var(--ink-4)] outline-none transition-colors focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--ink-3)]">{t("dashboard.platform")}</label>
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex flex-wrap rounded-md border border-[var(--line-2)] bg-[var(--bg)] p-0.5">
                  {formPlatformOptions.map((slug) => {
                    const color = platformColor(slug);
                    const active = formPlatform === slug;
                    return (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => setFormPlatform(slug)}
                        className={`flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-xs font-medium transition-all ${
                          active
                            ? "text-[var(--ink)]"
                            : "text-[var(--ink-4)] hover:text-[var(--ink-3)]"
                        }`}
                        style={active ? { backgroundColor: `${color}26` } : undefined}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {platformDisplayName(slug)}
                      </button>
                    );
                  })}
                </div>
                <Link
                  href="/dashboard/add-property"
                  className="flex items-center gap-1 rounded-md border border-dashed border-[var(--line-2)] px-3 py-1.5 text-xs text-[var(--ink-4)] transition-colors hover:border-[var(--line-3)] hover:text-[var(--ink-3)]"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {locale === "ru" ? "Добавить платформу" : "Add platform"}
                </Link>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--ink-3)]">{t("dashboard.dates")}</label>
              <DateSlider
                checkIn={formCheckIn}
                checkOut={formCheckOut}
                onChangeCheckIn={setFormCheckIn}
                onChangeCheckOut={setFormCheckOut}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="rounded-md bg-[var(--m-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)]"
              >
                {t("dashboard.createReservation")}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md px-4 py-2 text-sm text-[var(--ink-3)] hover:text-[var(--ink)]"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      {allReservations.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === "ru" ? "Поиск по имени гостя..." : "Search by guest name..."}
            className="h-9 w-full rounded-md border border-[var(--line)] bg-[var(--bg-2)] pl-9 pr-8 text-sm text-[var(--ink)] placeholder-[var(--ink-4)] outline-none transition-colors focus:border-[var(--line-2)]"
          />
          <svg className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M16.5 10.5a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--ink-4)] hover:text-[var(--ink)]"
              aria-label="Clear search"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Reservations List */}
      {displayReservations.length > 0 || (useSections && past.length > 0) ? (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <h2 className="text-xs font-medium text-[var(--ink-3)]">
              {selectedProperty
                ? t("dashboard.reservations")
                : t("dashboard.upcomingReservations")}
              {trimmedQuery && (
                <span className="ml-2 text-[var(--ink-4)]">
                  · {displayReservations.length} {locale === "ru" ? "найдено" : "found"}
                </span>
              )}
            </h2>
          </div>
          {useSections ? (
            <div>
              {next7.length > 0 && (
                <>
                  {(later.length > 0 || past.length > 0) && (
                    <ReservationSectionHeader label={t("calendar.next7Days")} />
                  )}
                  {next7.map((res, i) => (
                    <ReservationRow
                      key={res.id}
                      res={res}
                      isLast={i === next7.length - 1 && later.length === 0 && (!showPast || past.length === 0)}
                      hideProperty={false}
                      formatDate={formatDate}
                      dayCount={dayCount}
                      locale={locale}
                      onClick={() => handleRowClick(res.propertyId, res.id)}
                      muted={false}
                    />
                  ))}
                </>
              )}
              {later.length > 0 && (
                <>
                  <ReservationSectionHeader label={t("calendar.later")} />
                  {later.map((res, i) => (
                    <ReservationRow
                      key={res.id}
                      res={res}
                      isLast={i === later.length - 1 && (!showPast || past.length === 0)}
                      hideProperty={false}
                      formatDate={formatDate}
                      dayCount={dayCount}
                      locale={locale}
                      onClick={() => handleRowClick(res.propertyId, res.id)}
                      muted={false}
                    />
                  ))}
                </>
              )}
              {past.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPast((v) => !v)}
                    className="flex w-full items-center justify-between border-b border-[var(--line)]/50 bg-[var(--bg-3)]/40 px-4 py-1.5 text-left transition-colors hover:bg-[var(--bg-3)]/70"
                  >
                    <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                      {showPast
                        ? t("dashboard.hidePast")
                        : t("dashboard.showPast").replace("{n}", String(past.length))}
                    </span>
                    <svg
                      className={`h-3.5 w-3.5 text-[var(--ink-4)] transition-transform ${showPast ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {showPast && past.map((res, i) => (
                    <ReservationRow
                      key={res.id}
                      res={res}
                      isLast={i === past.length - 1}
                      hideProperty={false}
                      formatDate={formatDate}
                      dayCount={dayCount}
                      locale={locale}
                      onClick={() => handleRowClick(res.propertyId, res.id)}
                      muted={true}
                    />
                  ))}
                </>
              )}
            </div>
          ) : (
            <div>
              {displayReservations.map((res, i) => (
                <ReservationRow
                  key={res.id}
                  res={res}
                  isLast={i === displayReservations.length - 1}
                  hideProperty={Boolean(selectedProperty)}
                  formatDate={formatDate}
                  dayCount={dayCount}
                  locale={locale}
                  onClick={() => handleRowClick(res.propertyId, res.id)}
                  muted={false}
                />
              ))}
            </div>
          )}
        </div>
      ) : !isZeroProperties ? (
        <div className="rounded-lg border border-dashed border-[var(--line)] py-16 text-center">
          <p className="text-sm text-[var(--ink-4)]">
            {selectedProperty
              ? t("dashboard.noReservations")
              : t("dashboard.noReservationsGlobal")}
          </p>
        </div>
      ) : null}

      {/* Cleaning Schedule — separate section on global dashboard */}
      {!selectedProperty && properties.length > 0 && Object.keys(allSyncedEvents).length > 0 && (
        <CleaningSchedule
          properties={properties}
          syncedEvents={allSyncedEvents}
          links={allLinks}
          overrides={allOverrides}
          mode="dashboard"
          onOverrideChanged={fetchAllCalendarData}
        />
      )}
    </div>
  );
}

function ReservationSectionHeader({ label }: { label: string }) {
  return (
    <div className="border-b border-[var(--line)]/50 bg-[var(--bg-3)]/40 px-4 py-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
        {label}
      </span>
    </div>
  );
}

interface ReservationRowProps {
  res: {
    id: number;
    name: string;
    platform: string;
    checkIn: string;
    checkOut: string;
    propertyName: string;
    propertyId: number;
    _count?: { guests: number };
  };
  isLast: boolean;
  hideProperty: boolean;
  formatDate: (d: string) => string;
  dayCount: (a: string, b: string) => number;
  locale: string;
  onClick: () => void;
  muted: boolean;
}

function ReservationRow({ res, isLast, hideProperty, formatDate, dayCount, locale, onClick, muted }: ReservationRowProps) {
  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-[var(--bg-3)] ${
        !isLast ? "border-b border-[var(--line)]/50" : ""
      } ${muted ? "opacity-60" : ""}`}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: platformColor(res.platform) }}
      />

      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-[var(--ink)]">{res.name}</span>
      </div>

      {!hideProperty && (
        <span className="hidden text-sm text-[var(--ink-3)] sm:block">
          {res.propertyName}
        </span>
      )}

      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-[var(--ink-2)]"
        style={{ backgroundColor: `${platformColor(res.platform)}26` }}
      >
        {platformDisplayName(res.platform)}
      </span>

      <span className="shrink-0 text-sm text-[var(--ink-3)]">
        {formatDate(res.checkIn)} — {formatDate(res.checkOut)}
      </span>

      <span className="shrink-0 w-10 text-right text-xs text-[var(--ink-4)]">
        {dayCount(res.checkIn, res.checkOut)}{locale === "ru" ? "д" : "d"}
      </span>

      <span className="shrink-0 w-10 text-right text-xs text-[var(--ink-4)]">
        {res._count?.guests || 0}
        <span className="ml-0.5 text-[var(--ink-4)]">{locale === "ru" ? "г" : "g"}</span>
      </span>

      <svg className="h-4 w-4 shrink-0 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </div>
  );
}
