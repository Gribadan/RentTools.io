"use client";

import { useState, useEffect, useCallback } from "react";
import { DateSlider } from "@/components/date-slider";
import { CleaningSchedule } from "@/components/cleaning-schedule";
import { WelcomeModal } from "@/components/welcome-modal";
import { useI18n } from "@/lib/i18n/context";
import type { Property, CalendarLink, DateOverride } from "@/lib/types";

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
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const displayReservations = trimmedQuery
    ? allReservations.filter((r) => r.name.toLowerCase().includes(trimmedQuery))
    : allReservations;

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
          <p className="mt-1 text-sm text-[var(--ink-4)]">{subtitle}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--m-accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t("dashboard.newReservation")}
        </button>
      </div>

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
              <div className="flex w-fit rounded-md border border-[var(--line-2)] bg-[var(--bg)] p-0.5">
                {(["airbnb", "booking"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormPlatform(p)}
                    className={`rounded-[5px] px-4 py-1.5 text-xs font-medium transition-all ${
                      formPlatform === p
                        ? p === "airbnb"
                          ? "bg-[var(--m-accent)]/15 text-[var(--m-accent)]"
                          : "bg-[#003580]/25 text-sky-300"
                        : "text-[var(--ink-4)] hover:text-[var(--ink-3)]"
                    }`}
                  >
                    {p === "airbnb" ? "Airbnb" : "Booking"}
                  </button>
                ))}
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
      {displayReservations.length > 0 ? (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <h2 className="text-xs font-medium text-[var(--ink-3)]">
              {selectedProperty ? t("dashboard.reservations") : t("dashboard.recentReservations")}
              {trimmedQuery && (
                <span className="ml-2 text-[var(--ink-4)]">
                  · {displayReservations.length} {locale === "ru" ? "найдено" : "found"}
                </span>
              )}
            </h2>
          </div>
          <div>
            {displayReservations.map((res, i) => (
              <div
                key={res.id}
                onClick={() => handleRowClick(res.propertyId, res.id)}
                className={`flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-[var(--bg-3)] ${
                  i < displayReservations.length - 1 ? "border-b border-[var(--line)]/50" : ""
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    res.platform === "booking" ? "bg-sky-300" : "bg-[var(--m-accent)]"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-[var(--ink)]">{res.name}</span>
                </div>

                {!selectedProperty && (
                  <span className="hidden text-sm text-[var(--ink-3)] sm:block">
                    {res.propertyName}
                  </span>
                )}

                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                    res.platform === "booking"
                      ? "bg-[#003580]/20 text-sky-300"
                      : "bg-[var(--m-accent)]/10 text-[var(--m-accent)]"
                  }`}
                >
                  {res.platform === "booking" ? "Booking" : "Airbnb"}
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
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--line)] py-16 text-center">
          <p className="text-sm text-[var(--ink-4)]">
            {selectedProperty
              ? t("dashboard.noReservations")
              : t("dashboard.noReservationsGlobal")}
          </p>
        </div>
      )}

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
