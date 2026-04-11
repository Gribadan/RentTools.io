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
          <h1 className="text-2xl font-bold text-[#e8ecf2]">{title}</h1>
          <p className="mt-1 text-sm text-[#6b7280]">{subtitle}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg bg-[#059669] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#047857]"
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
                className="group rounded-xl border border-[#1e2533] bg-[#13171e] p-5 text-left transition-all hover:border-[#2a3142] hover:bg-[#1a1f2b]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#e8ecf2] group-hover:text-[#6c8fff] transition-colors">{p.name}</h3>
                  <svg className="h-4 w-4 text-[#2a3142] group-hover:text-[#6b7280] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                    <span>{futureRes.length} {locale === "ru" ? "бронир." : "bookings"}</span>
                    <span className="text-[#2a3142]">·</span>
                    <span>{locale === "ru" ? "мин." : "min"} {p.minNights} {locale === "ru" ? "ноч." : "n"}</span>
                  </div>
                  {nextRes && (
                    <div className="text-xs text-[#8b92a0]">
                      <span className="text-[#6b7280]">{locale === "ru" ? "Далее:" : "Next:"} </span>
                      <span className="font-medium text-[#d4d8e0]">{nextRes.name}</span>
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
        <div className="rounded-lg border border-[#2a3142] bg-[#13171e] p-5">
          <h2 className="mb-4 text-sm font-medium text-[#e8ecf2]">{t("dashboard.newReservation")}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs text-[#8b92a0]">{t("dashboard.property")}</label>
                <div className="relative">
                  <select
                    value={formPropertyId}
                    onChange={(e) => setFormPropertyId(Number(e.target.value))}
                    className="h-9 w-full appearance-none rounded-md border border-[#2a3142] bg-[#0c0f14] pl-3 pr-8 text-sm text-[#e8ecf2] outline-none transition-colors focus:border-[#6c8fff] focus:ring-1 focus:ring-[#6c8fff]/30"
                    required
                  >
                    <option value="" disabled>{t("dashboard.selectProperty")}</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#8b92a0]">{t("dashboard.guestName")}</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t("dashboard.enterName")}
                  className="h-9 w-full rounded-md border border-[#2a3142] bg-[#0c0f14] px-3 text-sm text-[#e8ecf2] placeholder-[#6b7280] outline-none transition-colors focus:border-[#6c8fff] focus:ring-1 focus:ring-[#6c8fff]/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#8b92a0]">{t("dashboard.platform")}</label>
              <div className="flex w-fit rounded-md border border-[#2a3142] bg-[#0c0f14] p-0.5">
                {(["airbnb", "booking"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormPlatform(p)}
                    className={`rounded-[5px] px-4 py-1.5 text-xs font-medium transition-all ${
                      formPlatform === p
                        ? p === "airbnb"
                          ? "bg-[#f43f5e]/15 text-[#fb923c]"
                          : "bg-[#2563eb]/25 text-[#93c5fd]"
                        : "text-[#6b7280] hover:text-[#8b92a0]"
                    }`}
                  >
                    {p === "airbnb" ? "Airbnb" : "Booking"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#8b92a0]">{t("dashboard.dates")}</label>
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
                className="rounded-md bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#047857]"
              >
                {t("dashboard.createReservation")}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md px-4 py-2 text-sm text-[#8b92a0] hover:text-[#e8ecf2]"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reservations List */}
      {displayReservations.length > 0 ? (
        <div className="rounded-lg border border-[#1e2533] bg-[#13171e]">
          <div className="border-b border-[#1e2533] px-4 py-3">
            <h2 className="text-xs font-medium text-[#8b92a0]">
              {selectedProperty ? t("dashboard.reservations") : t("dashboard.recentReservations")}
            </h2>
          </div>
          <div>
            {displayReservations.map((res, i) => (
              <div
                key={res.id}
                onClick={() => handleRowClick(res.propertyId, res.id)}
                className={`flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-[#1a1f2b] ${
                  i < displayReservations.length - 1 ? "border-b border-[#1e2533]/50" : ""
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    res.platform === "booking" ? "bg-[#93c5fd]" : "bg-[#fb923c]"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-[#e8ecf2]">{res.name}</span>
                </div>

                {!selectedProperty && (
                  <span className="hidden text-sm text-[#8b92a0] sm:block">
                    {res.propertyName}
                  </span>
                )}

                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                    res.platform === "booking"
                      ? "bg-[#2563eb]/20 text-[#93c5fd]"
                      : "bg-[#f43f5e]/10 text-[#fb923c]"
                  }`}
                >
                  {res.platform === "booking" ? "Booking" : "Airbnb"}
                </span>

                <span className="shrink-0 text-sm text-[#8b92a0]">
                  {formatDate(res.checkIn)} — {formatDate(res.checkOut)}
                </span>

                <span className="shrink-0 w-10 text-right text-xs text-[#6b7280]">
                  {dayCount(res.checkIn, res.checkOut)}{locale === "ru" ? "д" : "d"}
                </span>

                <span className="shrink-0 w-10 text-right text-xs text-[#6b7280]">
                  {res._count?.guests || 0}
                  <span className="ml-0.5 text-[#2a3142]">{locale === "ru" ? "г" : "g"}</span>
                </span>

                <svg className="h-4 w-4 shrink-0 text-[#2a3142]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#1e2533] py-16 text-center">
          <p className="text-sm text-[#6b7280]">
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
