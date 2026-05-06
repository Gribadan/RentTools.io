"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { DateSlider } from "@/components/date-slider";
import { CleaningSchedule, type CleanerAssignmentInfo } from "@/components/cleaning-schedule";
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
  uid?: string;
  summary: string;
  startDate: string;
  endDate: string;
}

interface UnifiedStay {
  start: Date;
  end: Date;
  name: string;
  platform: string;
  reservationId?: number;
}

/** True for iCal summaries that almost always indicate "this is a
 *  generic blocked booking, not a guest name" — Airbnb's "Reserved",
 *  Booking.com's "CLOSED - Not available", host-blocks, etc. Used to
 *  distinguish iCal twins of manually-entered Reservations (which the
 *  host hasn't claimed via the bar-claim popover) from a real second
 *  booking that just happens to overlap on the same dates. */
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

/** Build a deduped list of stays for one property from Reservation rows
 *  + iCal-synced events. Three layers of dedup so the dashboard never
 *  double-counts the SAME booking represented in two places:
 *    1. iCal events whose uid matches a Reservation.linkedEventUid
 *       (the host explicitly claimed the bar) → drop the iCal side.
 *    2. iCal events with generic summaries (Reserved / Blocked / etc)
 *       whose start+end exactly match a Reservation's dates → drop
 *       the iCal side. This catches the very common case of a host
 *       creating a Reservation manually without going through the
 *       bar-claim popover, leaving the iCal twin orphaned.
 *    3. Airbnb host-blocks ("Not available" / "Blocked") are filtered
 *       out — they're not real guests.
 *  Sorted by start asc. */
function buildUnifiedStays(p: Property, events: CalendarEvent[]): UnifiedStay[] {
  const linkedUids = new Set(
    p.reservations.map((r) => r.linkedEventUid).filter((u): u is string => !!u)
  );
  // Reservation date-range keys — used to silently merge generic-named
  // iCal events with the host's manual entry on identical dates.
  const reservationDateKeys = new Set<string>();
  for (const r of p.reservations) {
    const start = new Date(r.checkIn).toISOString().substring(0, 10);
    const end = new Date(r.checkOut).toISOString().substring(0, 10);
    reservationDateKeys.add(`${start}|${end}`);
  }
  const stays: UnifiedStay[] = [];
  for (const r of p.reservations) {
    const start = new Date(r.checkIn);
    start.setHours(0, 0, 0, 0);
    const end = new Date(r.checkOut);
    end.setHours(0, 0, 0, 0);
    stays.push({
      start,
      end,
      name: r.name,
      platform: r.platform || "direct",
      reservationId: r.id,
    });
  }
  for (const ev of events) {
    if (ev.uid && linkedUids.has(ev.uid)) continue;
    if (ev.platform === "airbnb" && (ev.summary?.includes("Not available") || ev.summary?.includes("Blocked"))) continue;
    // Same-dates + generic-summary heuristic: drop the iCal twin.
    const dateKey = `${ev.startDate}|${ev.endDate}`;
    if (reservationDateKeys.has(dateKey) && isGenericIcalName(ev.summary || "")) continue;
    const start = new Date(ev.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(ev.endDate);
    end.setHours(0, 0, 0, 0);
    stays.push({ start, end, name: ev.summary, platform: ev.platform });
  }
  stays.sort((a, b) => a.start.getTime() - b.start.getTime());
  return stays;
}

/** Per-property double-booking detection. Returns the list of overlapping
 *  pairs whose overlap range still touches today-or-future, so a stale
 *  past conflict doesn't show as an active alert on the dashboard. */
function detectDoubleBookings(stays: UnifiedStay[], today: Date): Array<{
  aName: string;
  bName: string;
  overlapStart: Date;
  overlapEnd: Date;
}> {
  const out: Array<{ aName: string; bName: string; overlapStart: Date; overlapEnd: Date }> = [];
  for (let i = 0; i < stays.length; i++) {
    for (let j = i + 1; j < stays.length; j++) {
      const a = stays[i];
      const b = stays[j];
      // Strict overlap: a.start < b.end AND b.start < a.end. Touching
      // dates (a.end === b.start) are NOT a conflict — that's a normal
      // turnover (one guest checks out, next checks in same day).
      if (a.start < b.end && b.start < a.end) {
        const overlapStart = a.start > b.start ? a.start : b.start;
        const overlapEnd = a.end < b.end ? a.end : b.end;
        if (overlapEnd > today) {
          out.push({ aName: a.name, bName: b.name, overlapStart, overlapEnd });
        }
      }
    }
  }
  return out;
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
  // RT-25.10 tick 3 — per-property cleaner-assignment data, threaded
  // into <CleaningSchedule> for cleaner-conflict detection. Populated
  // from /api/cleaners?withAssignments=1 in dashboard mode only.
  const [cleanerAssignments, setCleanerAssignments] = useState<Record<number, CleanerAssignmentInfo[]>>({});
  const [cleanerConflictDates, setCleanerConflictDates] = useState<string[]>([]);

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

  // RT-25.10 tick 3 — fetch the host's cleaner pool with assignments so
  // CleaningSchedule can detect cleaner conflicts across properties.
  // Only meaningful in dashboard mode (multi-property); per-property
  // mode has its own fetch in PropertyCleaningView. Skip until at least
  // one property exists.
  useEffect(() => {
    if (selectedProperty || properties.length === 0) {
      setCleanerAssignments({});
      return;
    }
    let cancelled = false;
    fetch(`/api/cleaners?withAssignments=1`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ id: number; name: string; assignments?: Array<{ propertyId: number; priority: number }> }>) => {
        if (cancelled || !Array.isArray(rows)) return;
        const map: Record<number, CleanerAssignmentInfo[]> = {};
        for (const c of rows) {
          for (const a of c.assignments ?? []) {
            const list = map[a.propertyId] ?? (map[a.propertyId] = []);
            list.push({ identityKey: `p:${c.id}`, name: c.name, priority: a.priority });
          }
        }
        for (const list of Object.values(map)) list.sort((a, b) => a.priority - b.priority);
        setCleanerAssignments(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selectedProperty, properties.length]);

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

  // RT-25.6 tick 5 — today's check-ins / check-outs across all
  // properties. Drives the "Today" strip at the top of the global
  // dashboard so a returning host can scan today's events without
  // hunting through the upcoming-week list. Hidden when both buckets
  // are empty so the strip doesn't add noise on quiet days.
  const { todayCheckIns, todayCheckOuts } = useMemo(() => {
    if (selectedProperty) {
      return { todayCheckIns: [], todayCheckOuts: [] as typeof allReservations };
    }
    const ins: typeof allReservations = [];
    const outs: typeof allReservations = [];
    for (const r of allReservations) {
      if (r.checkIn === todayStr) ins.push(r);
      if (r.checkOut === todayStr) outs.push(r);
    }
    return { todayCheckIns: ins, todayCheckOuts: outs };
  }, [allReservations, selectedProperty, todayStr]);

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

  // RT-25.10 tick 3 — derive whether each visible bucket overlaps any
  // cleaner-conflict date so the badge only shows when relevant.
  const hasCleanerConflictToday = useMemo(
    () => cleanerConflictDates.includes(todayStr),
    [cleanerConflictDates, todayStr]
  );
  const hasCleanerConflictNext7 = useMemo(
    () => cleanerConflictDates.some((d) => d >= todayStr && d < sevenDaysOutStr),
    [cleanerConflictDates, todayStr, sevenDaysOutStr]
  );

  // Per-property "now / next" data drives the property cards: who is
  // currently in the property and how many nights they have left, plus
  // the next arriving guest. Computed once per render against the
  // unified stay list so reservations + iCal events stay in lockstep.
  const propertyOccupancy = useMemo(() => {
    if (selectedProperty) return new Map<number, { current: UnifiedStay | null; next: UnifiedStay | null }>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const map = new Map<number, { current: UnifiedStay | null; next: UnifiedStay | null }>();
    for (const p of properties) {
      const stays = buildUnifiedStays(p, allSyncedEvents[p.id] || []);
      const current = stays.find((s) => s.start <= today && s.end > today) ?? null;
      const next = stays.find((s) => s.start > today) ?? null;
      map.set(p.id, { current, next });
    }
    return map;
  }, [properties, allSyncedEvents, selectedProperty]);

  // Double-booking + no-cleaner alerts. Surfaced in the Alerts strip
  // above the property cards so the host sees structural problems
  // before scanning individual properties. Only computed in dashboard
  // mode (where the strip renders).
  const dashboardAlerts = useMemo(() => {
    if (selectedProperty) {
      return { doubleBookings: [] as Array<{ propertyName: string; aName: string; bName: string; overlapStart: Date; overlapEnd: Date }>, propertiesWithoutCleaner: [] as string[] };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const doubleBookings: Array<{ propertyName: string; aName: string; bName: string; overlapStart: Date; overlapEnd: Date }> = [];
    const propertiesWithoutCleaner: string[] = [];
    for (const p of properties) {
      const stays = buildUnifiedStays(p, allSyncedEvents[p.id] || []);
      const overlaps = detectDoubleBookings(stays, today);
      for (const o of overlaps) {
        doubleBookings.push({ propertyName: p.name, ...o });
      }
      // Only flag missing cleaner if the property has cleaning enabled
      // AND has at least one upcoming stay (no point warning about an
      // empty property).
      const cleaningOn = p.cleaningEnabled !== false;
      const hasUpcoming = stays.some((s) => s.end > today);
      const assigns = cleanerAssignments[p.id];
      const hasCleaner = Array.isArray(assigns) && assigns.length > 0;
      if (cleaningOn && hasUpcoming && !hasCleaner) {
        propertiesWithoutCleaner.push(p.name);
      }
    }
    return { doubleBookings, propertiesWithoutCleaner };
  }, [properties, allSyncedEvents, cleanerAssignments, selectedProperty]);

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

  // RT-25.6 tick 7 — in-form conflict warning. Surfaces overlapping
  // reservations + synced calendar events on the picked property/date
  // range BEFORE the host hits "Create Reservation". Addresses a slice
  // of the tick 2 deferred "show what's already booked" item without
  // touching DateSlider's internals (a separate larger lift).
  // Touching dates (checkout === next checkin) are NOT counted as
  // overlap to match the same-day-turnover convention used elsewhere.
  // Synced events come from allSyncedEvents (populated in dashboard
  // mode); in selectedProperty mode the warning relies on the
  // property's Reservation rows alone, which is acceptable since most
  // synced bookings ARE represented as reservations or via the
  // calendar's own conflict UI in that view.
  const formConflicts = useMemo(() => {
    if (!formPropertyId || !formCheckIn || !formCheckOut) return [];
    if (formCheckIn >= formCheckOut) return [];
    const pid = Number(formPropertyId);
    const property = properties.find((p) => p.id === pid);
    type Conflict = { key: string; name: string; platform: string; from: string; to: string };
    const out: Conflict[] = [];
    if (property) {
      for (const res of property.reservations) {
        if (res.checkIn < formCheckOut && res.checkOut > formCheckIn) {
          out.push({
            key: `r-${res.id}`,
            name: res.name,
            platform: res.platform,
            from: res.checkIn,
            to: res.checkOut,
          });
        }
      }
    }
    const events = allSyncedEvents[pid] || [];
    for (const ev of events) {
      if (ev.startDate < formCheckOut && ev.endDate > formCheckIn) {
        out.push({
          key: `e-${ev.id}`,
          name: ev.summary || platformDisplayName(ev.platform),
          platform: ev.platform,
          from: ev.startDate,
          to: ev.endDate,
        });
      }
    }
    return out;
  }, [formPropertyId, formCheckIn, formCheckOut, properties, allSyncedEvents]);

  // RT-25.6 tick 8 — booked-dates set for the in-form date picker.
  // Same data sources as the conflict warning (tick 7) — Reservation
  // rows + allSyncedEvents — but rolled out into a Set<dateString> so
  // CalendarGrid can mark each occupied day with a small amber dot.
  // Convention: a booking [checkIn, checkOut) occupies the nights from
  // checkIn (inclusive) through the day BEFORE checkOut (exclusive),
  // matching the "touching dates aren't a conflict" rule the rest of
  // the app uses (same-day turnovers are allowed). Recomputes only
  // when the picked property's data actually changes; the form being
  // hidden costs nothing at runtime.
  const bookedDates = useMemo(() => {
    const set = new Set<string>();
    if (!formPropertyId) return set;
    const pid = Number(formPropertyId);
    const property = properties.find((p) => p.id === pid);
    const addRange = (from: string, to: string) => {
      if (!from || !to || from >= to) return;
      const start = new Date(from + "T00:00:00");
      const end = new Date(to + "T00:00:00");
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        set.add(`${y}-${m}-${day}`);
      }
    };
    if (property) {
      for (const res of property.reservations) {
        addRange(res.checkIn, res.checkOut);
      }
    }
    const events = allSyncedEvents[pid] || [];
    for (const ev of events) {
      addRange(ev.startDate, ev.endDate);
    }
    return set;
  }, [formPropertyId, properties, allSyncedEvents]);

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

  // Stats for the dashboard sidebar — light-weight portfolio
  // summary so the right column has actionable signal next to the
  // quick-add CTA. Computed only in dashboard mode (per-property
  // mode renders a different reservation list, no stats sidebar).
  const portfolioStats = useMemo(() => {
    if (selectedProperty) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let upcoming = 0;
    let active = 0;
    for (const r of allReservations) {
      const ci = new Date(r.checkIn);
      ci.setHours(0, 0, 0, 0);
      const co = new Date(r.checkOut);
      co.setHours(0, 0, 0, 0);
      if (ci <= today && co > today) active += 1;
      else if (ci > today) upcoming += 1;
    }
    return { properties: properties.length, active, upcoming, total: allReservations.length };
  }, [selectedProperty, properties.length, allReservations]);

  return (
    /* Two-column shell — matches the calendar / cleaning / reports
       pages so navigation feels uniform. Outer escapes <main>'s
       side padding (1:1 alignment with the dashboard header); inner
       max-w-1760 caps the content rectangle on ultra-wide. The
       sidebar sticks (lg:sticky lg:top-3) so a long reservations
       list keeps the quick-add CTA in view. Per-property mode
       (selectedProperty != null) renders only the main column —
       the stats sidebar is portfolio-scoped and would be empty. */
    <div className="-mx-3 sm:-mx-6 lg:-mx-8">
    <div className="mx-auto max-w-[1760px] px-3 sm:px-5 flex flex-col lg:flex-row gap-6">
    <div className="min-w-0 lg:flex-1 space-y-6">
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
          /* "+ New Reservation" routes to the calendar instead of
              opening an inline form. The calendar's date popover
              already owns the create-reservation flow (click date →
              Create reservation), so a separate form is duplication.
              In dashboard mode we land on the first property; in
              per-property mode we route to the current property's
              calendar tab. */
          <Link
            href={
              selectedProperty
                ? `/dashboard?property=${selectedProperty.id}&view=calendar`
                : `/dashboard?property=${properties[0]?.id ?? ""}&view=calendar`
            }
            className="flex items-center gap-1.5 rounded-lg bg-[var(--m-accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("dashboard.newReservation")}
          </Link>
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

      {/* Today strip — check-ins + check-outs scheduled for today across
          all properties. Skipped on quiet days so the dashboard stays
          calm when nothing is happening. RT-25.6 tick 5. */}
      {!selectedProperty && properties.length > 0 && (todayCheckIns.length > 0 || todayCheckOuts.length > 0) && (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-4">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-3)]">
              {t("dashboard.today")}
            </h2>
            <span className="text-xs text-[var(--ink-4)]">
              {new Date().toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", { weekday: "short", day: "2-digit", month: "short" })}
            </span>
            {hasCleanerConflictToday && (
              <a
                href="#cleaning-schedule"
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-amber-300 transition-colors hover:bg-amber-500/15"
                style={{ backgroundColor: "rgba(217,119,6,0.18)" }}
                title={t("dashboard.cleanerConflictHint")}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {t("dashboard.cleanerConflictBadge")}
              </a>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {todayCheckIns.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                  {t("dashboard.todayCheckIn")} · {todayCheckIns.length}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {todayCheckIns.map((res) => (
                    <button
                      key={`in-${res.id}`}
                      type="button"
                      onClick={() => handleRowClick(res.propertyId, res.id)}
                      className="flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1.5 text-xs text-[var(--ink-2)] transition-colors hover:border-[var(--line-2)] hover:bg-[var(--bg-3)]"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: platformColor(res.platform) }}
                      />
                      <span className="font-medium text-[var(--ink)]">{res.name}</span>
                      <span className="text-[var(--ink-4)]">·</span>
                      <span>{res.propertyName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {todayCheckOuts.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                  {t("dashboard.todayCheckOut")} · {todayCheckOuts.length}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {todayCheckOuts.map((res) => (
                    <button
                      key={`out-${res.id}`}
                      type="button"
                      onClick={() => handleRowClick(res.propertyId, res.id)}
                      className="flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1.5 text-xs text-[var(--ink-2)] transition-colors hover:border-[var(--line-2)] hover:bg-[var(--bg-3)]"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: platformColor(res.platform) }}
                      />
                      <span className="font-medium text-[var(--ink)]">{res.name}</span>
                      <span className="text-[var(--ink-4)]">·</span>
                      <span>{res.propertyName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts strip — only renders when there's at least one
          structural problem worth surfacing on the dashboard root.
          Three categories: double-booked stays (per-property overlap),
          cleaner conflicts (one cleaner across multiple properties on
          the same day, computed by the hidden CleaningSchedule), and
          properties with cleaning enabled but no cleaner assigned. */}
      {!selectedProperty && (dashboardAlerts.doubleBookings.length > 0 || cleanerConflictDates.length > 0 || dashboardAlerts.propertiesWithoutCleaner.length > 0) && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-sm font-semibold text-amber-300">
              {locale === "ru" ? "Требует внимания" : "Needs attention"}
            </span>
          </div>
          {dashboardAlerts.doubleBookings.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-[var(--ink-2)]">
              <span className="font-medium text-rose-400">
                {locale === "ru" ? "Двойное бронирование:" : "Double booking:"}
              </span>
              {dashboardAlerts.doubleBookings.slice(0, 3).map((d, i) => (
                <span key={i} className="text-[var(--ink-2)]">
                  {d.propertyName} — {d.aName} & {d.bName} ({formatDate(d.overlapStart.toISOString().substring(0, 10))} → {formatDate(d.overlapEnd.toISOString().substring(0, 10))})
                  {i < Math.min(dashboardAlerts.doubleBookings.length, 3) - 1 ? "," : ""}
                </span>
              ))}
              {dashboardAlerts.doubleBookings.length > 3 && (
                <span className="text-[var(--ink-3)]">
                  {locale === "ru" ? `+ ещё ${dashboardAlerts.doubleBookings.length - 3}` : `+ ${dashboardAlerts.doubleBookings.length - 3} more`}
                </span>
              )}
            </div>
          )}
          {cleanerConflictDates.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-[var(--ink-2)]">
              <span className="font-medium text-amber-300">
                {locale === "ru" ? "Конфликт уборщиков:" : "Cleaner conflict:"}
              </span>
              <span>
                {cleanerConflictDates.slice(0, 3).map((d) => formatDate(d)).join(", ")}
                {cleanerConflictDates.length > 3 && (locale === "ru" ? ` + ещё ${cleanerConflictDates.length - 3}` : ` + ${cleanerConflictDates.length - 3} more`)}
              </span>
              <a
                href="?view=cleaning"
                className="text-[11px] text-amber-400 hover:text-amber-300 underline"
              >
                {locale === "ru" ? "Открыть уборки →" : "Open cleaning →"}
              </a>
            </div>
          )}
          {dashboardAlerts.propertiesWithoutCleaner.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-[var(--ink-2)]">
              <span className="font-medium text-amber-300">
                {locale === "ru" ? "Уборщик не назначен:" : "No cleaner assigned:"}
              </span>
              <span>{dashboardAlerts.propertiesWithoutCleaner.join(", ")}</span>
            </div>
          )}
        </div>
      )}

      {/* Property cards (dashboard mode only). Each card surfaces the
          three things a host actually scans the dashboard for: who is
          IN the property right now (with nights remaining), who is
          coming NEXT (with arrival date), and any sync-error flag. */}
      {!selectedProperty && properties.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map(p => {
            const occ = propertyOccupancy.get(p.id);
            const current = occ?.current ?? null;
            const next = occ?.next ?? null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nightsLeft = current ? Math.round((current.end.getTime() - today.getTime()) / 86400000) : 0;
            const daysUntilNext = next ? Math.round((next.start.getTime() - today.getTime()) / 86400000) : 0;
            const futureRes = p.reservations.filter(r => new Date(r.checkOut) >= new Date());
            const links = allLinks[p.id];
            const failingLinks = Array.isArray(links)
              ? links.filter((l) => Boolean(l.lastError))
              : [];
            const hasSyncError = failingLinks.length > 0;
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
                <div className="space-y-2">
                  {/* Current guest — strongest line, accent color so the
                      eye lands on "who's in here right now" first. */}
                  {current ? (
                    <div className="flex items-baseline gap-2 text-sm">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: platformColor(current.platform) }}
                      />
                      <span className="font-semibold text-[var(--ink)] truncate">{current.name}</span>
                      <span className="text-[11px] text-[var(--ink-3)] whitespace-nowrap">
                        {locale === "ru"
                          ? `до ${formatDate(current.end.toISOString().substring(0, 10))} · ${nightsLeft} ${nightsLeft === 1 ? "ночь" : nightsLeft < 5 ? "ночи" : "ноч."}`
                          : `until ${formatDate(current.end.toISOString().substring(0, 10))} · ${nightsLeft} ${nightsLeft === 1 ? "night" : "nights"} left`}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--ink-3)]">
                      {locale === "ru" ? "Свободно" : "Available"}
                    </div>
                  )}
                  {/* Next guest — secondary line. Hidden when no upcoming
                      stay so the card stays visually quiet. */}
                  {next ? (
                    <div className="flex items-baseline gap-2 text-xs text-[var(--ink-3)]">
                      <span className="text-[var(--ink-4)]">{locale === "ru" ? "Далее:" : "Next:"}</span>
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: platformColor(next.platform) }}
                      />
                      <span className="font-medium text-[var(--ink-2)] truncate">{next.name}</span>
                      <span className="text-[var(--ink-4)] whitespace-nowrap">
                        {locale === "ru"
                          ? `${formatDate(next.start.toISOString().substring(0, 10))} (через ${daysUntilNext} д.)`
                          : `${formatDate(next.start.toISOString().substring(0, 10))} (in ${daysUntilNext}d)`}
                      </span>
                    </div>
                  ) : !current ? (
                    <div className="text-xs text-[var(--ink-4)]">
                      {locale === "ru" ? "Нет предстоящих броней" : "No upcoming bookings"}
                    </div>
                  ) : null}
                  {/* Footer meta — booking count, min nights, sync chip. */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--ink-4)] pt-1">
                    <span>{futureRes.length} {locale === "ru" ? "бронир." : "bookings"}</span>
                    <span>·</span>
                    <span>{locale === "ru" ? "мин." : "min"} {p.minNights}{locale === "ru" ? "н." : "n"}</span>
                    {hasSyncError && (
                      <>
                        <span>·</span>
                        <span
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-amber-300"
                          style={{ backgroundColor: "rgba(217,119,6,0.18)" }}
                          title={failingLinks.map((l) => `${platformDisplayName(l.platform)}: ${l.lastError}`).join("\n")}
                        >
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                          {locale === "ru" ? "Синхр." : "Sync"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
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
                    <ReservationSectionHeader
                      label={t("calendar.next7Days")}
                      badge={hasCleanerConflictNext7 ? (
                        <a
                          href="#cleaning-schedule"
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-amber-300 transition-colors hover:bg-amber-500/15"
                          style={{ backgroundColor: "rgba(217,119,6,0.18)" }}
                          title={t("dashboard.cleanerConflictHint")}
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                          {t("dashboard.cleanerConflictBadge")}
                        </a>
                      ) : undefined}
                    />
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

      {/* Cleaning has its own dedicated tab — no inline schedule on
          the dashboard. We still mount a HIDDEN CleaningSchedule
          purely so the cleaner-conflict detection logic runs and
          feeds the Today / Next-7-days conflict badges + the alerts
          strip via onCleanerConflictDatesChange. The visible
          schedule lives at activeView === "cleaning" inside
          GlobalCleaningView. */}
      {!selectedProperty && properties.length > 0 && Object.keys(allSyncedEvents).length > 0 && (
        <div className="hidden" aria-hidden="true">
          <CleaningSchedule
            properties={properties}
            syncedEvents={allSyncedEvents}
            links={allLinks}
            overrides={allOverrides}
            mode="dashboard"
            onOverrideChanged={fetchAllCalendarData}
            cleanerAssignments={cleanerAssignments}
            onCleanerConflictDatesChange={setCleanerConflictDates}
          />
        </div>
      )}
    </div>

      {/* Sidebar — portfolio summary + quick-add CTA. Mirrors the
          calendar / cleaning / reports sidebars so the dashboard
          feels like the same app. Hidden in per-property mode
          because the stats are inherently cross-property. */}
      {!selectedProperty && portfolioStats && (
        <aside className="w-full lg:w-[360px] lg:shrink-0 lg:sticky lg:top-3 lg:self-start lg:max-h-[calc(100vh-84px)] rounded-2xl bg-[var(--bg)] shadow-[0_1px_3px_-1px_rgba(0,0,0,0.04),0_4px_16px_-8px_rgba(0,0,0,0.06)] [overflow:clip]">
          <div className="border-b border-[var(--line)] px-5 py-4">
            <div className="text-xs uppercase tracking-wide text-[var(--ink-4)]">
              {locale === "ru" ? "Обзор" : "Dashboard"}
            </div>
            <div className="mt-0.5 text-base font-semibold text-[var(--ink)] truncate">
              {locale === "ru"
                ? `${portfolioStats.properties} ${portfolioStats.properties === 1 ? "объект" : portfolioStats.properties < 5 ? "объекта" : "объектов"}`
                : `${portfolioStats.properties} ${portfolioStats.properties === 1 ? "property" : "properties"}`}
            </div>
          </div>

          {/* Portfolio stats */}
          <div className="border-b border-[var(--line)] px-5 py-4 space-y-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] text-[var(--ink-3)]">
                {locale === "ru" ? "Сейчас в гостях" : "Currently staying"}
              </span>
              <span className="text-base font-semibold tabular-nums text-[var(--ink)]">{portfolioStats.active}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] text-[var(--ink-3)]">
                {locale === "ru" ? "Впереди" : "Upcoming"}
              </span>
              <span className="text-base font-semibold tabular-nums text-[var(--ink)]">{portfolioStats.upcoming}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] text-[var(--ink-3)]">
                {locale === "ru" ? "Всего броней" : "Total bookings"}
              </span>
              <span className="text-base font-semibold tabular-nums text-[var(--ink-2)]">{portfolioStats.total}</span>
            </div>
          </div>

          {/* Quick-add CTA — routes to the first property's calendar
              where the date popover handles the create flow. Same
              behaviour as the header button so the two CTAs stay in
              sync mentally. */}
          {!isZeroProperties && properties[0] && (
            <div className="border-b border-[var(--line)] px-5 py-4">
              <Link
                href={`/dashboard?property=${properties[0].id}&view=calendar`}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--m-accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t("dashboard.newReservation")}
              </Link>
              <p className="mt-2 text-[11px] text-[var(--ink-4)] leading-relaxed">
                {locale === "ru"
                  ? "Откроется календарь — кликните по дате, чтобы создать бронь."
                  : "Opens the calendar — click a date to create a reservation."}
              </p>
            </div>
          )}

          {/* Quick links */}
          <div className="px-5 py-4 space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)] mb-1.5">
              {locale === "ru" ? "Перейти" : "Jump to"}
            </div>
            <a
              href="?view=cleaning"
              className="block rounded-md px-2 py-1.5 text-sm text-[var(--ink-2)] hover:bg-[var(--bg-3)] transition-colors"
            >
              {locale === "ru" ? "Уборки →" : "Cleaning →"}
            </a>
            <a
              href="?view=reports"
              className="block rounded-md px-2 py-1.5 text-sm text-[var(--ink-2)] hover:bg-[var(--bg-3)] transition-colors"
            >
              {locale === "ru" ? "Отчёты →" : "Reports →"}
            </a>
          </div>
        </aside>
      )}
    </div>
    </div>
  );
}

function ReservationSectionHeader({ label, badge }: { label: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)]/50 bg-[var(--bg-3)]/40 px-4 py-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
        {label}
      </span>
      {badge}
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
