"use client";

import { useState, useEffect, useCallback } from "react";
import { DateSlider } from "@/components/date-slider";
import { CleaningSchedule } from "@/components/cleaning-schedule";
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
}

export function Dashboard({
  properties,
  selectedProperty,
  onSelectProperty,
  onSelectReservation,
  onAddReservation,
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

  // Fetch synced events, links, and overrides for all properties (for cleaning schedule)
  const fetchAllCalendarData = useCallback(async () => {
    if (selectedProperty || properties.length === 0) return;
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
  }, [properties, selectedProperty]);

  useEffect(() => {
    fetchAllCalendarData();
  }, [fetchAllCalendarData]);

  useEffect(() => {
    if (selectedProperty) {
      setFormPropertyId(selectedProperty.id);
    }
  }, [selectedProperty]);

  const displayReservations = selectedProperty
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e8e8ec]">{title}</h1>
          <p className="mt-1 text-sm text-[#71717a]">{subtitle}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg bg-[#ff385c] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#e0294d]"
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
                className="group rounded-xl border border-[#27272b] bg-[#18181b] p-5 text-left transition-all hover:border-[#333338] hover:bg-[#1e1e22]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#e8e8ec] group-hover:text-[#e8e8ec] transition-colors">{p.name}</h3>
                  <svg className="h-4 w-4 text-[#333338] group-hover:text-[#71717a] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-[#71717a]">
                    <span>{futureRes.length} {locale === "ru" ? "бронир." : "bookings"}</span>
                    <span className="text-[#333338]">·</span>
                    <span>{locale === "ru" ? "мин." : "min"} {p.minNights} {locale === "ru" ? "ноч." : "n"}</span>
                  </div>
                  {nextRes && (
                    <div className="text-xs text-[#a0a0a8]">
                      <span className="text-[#71717a]">{locale === "ru" ? "Далее:" : "Next:"} </span>
                      <span className="font-medium text-[#d4d4d8]">{nextRes.name}</span>
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
        <div className="rounded-lg border border-[#333338] bg-[#18181b] p-5">
          <h2 className="mb-4 text-sm font-medium text-[#e8e8ec]">{t("dashboard.newReservation")}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs text-[#a0a0a8]">{t("dashboard.property")}</label>
                <div className="relative">
                  <select
                    value={formPropertyId}
                    onChange={(e) => setFormPropertyId(Number(e.target.value))}
                    className="h-9 w-full appearance-none rounded-md border border-[#333338] bg-[#111113] pl-3 pr-8 text-sm text-[#e8e8ec] outline-none transition-colors focus:border-[#e8e8ec] focus:ring-1 focus:ring-[#e8e8ec]/30"
                    required
                  >
                    <option value="" disabled>{t("dashboard.selectProperty")}</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#a0a0a8]">{t("dashboard.guestName")}</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t("dashboard.enterName")}
                  className="h-9 w-full rounded-md border border-[#333338] bg-[#111113] px-3 text-sm text-[#e8e8ec] placeholder-[#71717a] outline-none transition-colors focus:border-[#e8e8ec] focus:ring-1 focus:ring-[#e8e8ec]/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#a0a0a8]">{t("dashboard.platform")}</label>
              <div className="flex w-fit rounded-md border border-[#333338] bg-[#111113] p-0.5">
                {(["airbnb", "booking"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormPlatform(p)}
                    className={`rounded-[5px] px-4 py-1.5 text-xs font-medium transition-all ${
                      formPlatform === p
                        ? p === "airbnb"
                          ? "bg-[#ff385c]/15 text-[#ff385c]"
                          : "bg-[#222222]/25 text-[#93c5fd]"
                        : "text-[#71717a] hover:text-[#a0a0a8]"
                    }`}
                  >
                    {p === "airbnb" ? "Airbnb" : "Booking"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#a0a0a8]">{t("dashboard.dates")}</label>
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
                className="rounded-md bg-[#ff385c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e0294d]"
              >
                {t("dashboard.createReservation")}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md px-4 py-2 text-sm text-[#a0a0a8] hover:text-[#e8e8ec]"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reservations List */}
      {displayReservations.length > 0 ? (
        <div className="rounded-lg border border-[#27272b] bg-[#18181b]">
          <div className="border-b border-[#27272b] px-4 py-3">
            <h2 className="text-xs font-medium text-[#a0a0a8]">
              {selectedProperty ? t("dashboard.reservations") : t("dashboard.recentReservations")}
            </h2>
          </div>
          <div>
            {displayReservations.map((res, i) => (
              <div
                key={res.id}
                onClick={() => handleRowClick(res.propertyId, res.id)}
                className={`flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-[#1e1e22] ${
                  i < displayReservations.length - 1 ? "border-b border-[#27272b]/50" : ""
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    res.platform === "booking" ? "bg-[#93c5fd]" : "bg-[#ff385c]"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-[#e8e8ec]">{res.name}</span>
                </div>

                {!selectedProperty && (
                  <span className="hidden text-sm text-[#a0a0a8] sm:block">
                    {res.propertyName}
                  </span>
                )}

                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                    res.platform === "booking"
                      ? "bg-[#222222]/20 text-[#93c5fd]"
                      : "bg-[#ff385c]/10 text-[#ff385c]"
                  }`}
                >
                  {res.platform === "booking" ? "Booking" : "Airbnb"}
                </span>

                <span className="shrink-0 text-sm text-[#a0a0a8]">
                  {formatDate(res.checkIn)} — {formatDate(res.checkOut)}
                </span>

                <span className="shrink-0 w-10 text-right text-xs text-[#71717a]">
                  {dayCount(res.checkIn, res.checkOut)}{locale === "ru" ? "д" : "d"}
                </span>

                <span className="shrink-0 w-10 text-right text-xs text-[#71717a]">
                  {res._count?.guests || 0}
                  <span className="ml-0.5 text-[#333338]">{locale === "ru" ? "г" : "g"}</span>
                </span>

                <svg className="h-4 w-4 shrink-0 text-[#333338]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#27272b] py-16 text-center">
          <p className="text-sm text-[#71717a]">
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
