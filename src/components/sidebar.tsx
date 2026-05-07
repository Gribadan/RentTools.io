"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateSlider } from "@/components/date-slider";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import { SUPPORTED_LOCALES } from "@/lib/i18n/alternates";
import type { Property, Reservation } from "@/lib/types";

interface CopyShape {
  dateLocale: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: { dateLocale: "en-GB" },
  ru: { dateLocale: "ru-RU" },
};

interface SidebarProps {
  properties: Property[];
  selectedPropertyId: number | null;
  selectedReservationId: number | null;
  onSelectProperty: (id: number) => void;
  onSelectReservation: (id: number) => void;
  onAddProperty: (name: string) => void;
  onDeleteProperty: (id: number) => void;
  onAddReservation: (data: {
    name: string;
    checkIn: string;
    checkOut: string;
    platform: string;
    propertyId: number;
  }) => void;
  onDeleteReservation: (id: number) => void;
  username: string;
  onSettings: () => void;
  onLogout: () => void;
  onDashboard: () => void;
  onCalendarSync: () => void;
  onTasks: () => void;
  showSettings: boolean;
  showCalendarSync: boolean;
  showTasks: boolean;
}

const COLORS = [
  "#3fb950", "#58a6ff", "#d29922", "#bc8cff",
  "#f78166", "#f85149", "#79c0ff", "#56d364",
];

export function Sidebar({
  properties,
  selectedPropertyId,
  selectedReservationId,
  onSelectProperty,
  onSelectReservation,
  onAddProperty,
  onDeleteProperty,
  onAddReservation,
  onDeleteReservation,
  username,
  onSettings,
  onLogout,
  onDashboard,
  onCalendarSync,
  onTasks,
  showSettings,
  showCalendarSync,
  showTasks,
}: SidebarProps) {
  const { t: tr, locale, setLocale } = useI18n();
  const c = COPY[locale];
  const [newPropertyName, setNewPropertyName] = useState("");
  const [showPropertyInput, setShowPropertyInput] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState<number | null>(null);
  const [resName, setResName] = useState("");
  const [resCheckIn, setResCheckIn] = useState("");
  const [resCheckOut, setResCheckOut] = useState("");
  const [resPlatform, setResPlatform] = useState("airbnb");

  const handleAddProperty = () => {
    if (newPropertyName.trim()) {
      onAddProperty(newPropertyName.trim());
      setNewPropertyName("");
      setShowPropertyInput(false);
    }
  };

  const handleAddReservation = (propertyId: number) => {
    if (resName.trim() && resCheckIn && resCheckOut) {
      onAddReservation({
        name: resName.trim(),
        checkIn: resCheckIn,
        checkOut: resCheckOut,
        platform: resPlatform,
        propertyId,
      });
      setResName("");
      setResCheckIn("");
      setResCheckOut("");
      setResPlatform("airbnb");
      setShowReservationForm(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(c.dateLocale, { day: "2-digit", month: "short" });

  const getColor = (id: number) => COLORS[id % COLORS.length];

  return (
    <div className="flex h-full w-[260px] flex-col border-r border-border bg-[#0d1117]">
      {/* Sidebar Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex cursor-pointer items-center gap-2.5 rounded-lg p-1 -m-1 transition-colors hover:bg-[#161b22]" onClick={onDashboard}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1c2128]">
            <svg className="h-4 w-4 text-[#58a6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-[#f0f6fc]">{tr("sidebar.title")}</div>
            <div className="text-xs text-[#9198a1]">{tr("sidebar.subtitle")}</div>
          </div>
        </div>
      </div>

      <div className="mx-3 h-px bg-[#21262d]" />

      {/* Dashboard link */}
      <div className="px-2 pt-2">
        <button
          onClick={onDashboard}
          className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
            !selectedPropertyId && !showSettings
              ? "bg-[#1c2128] text-[#f0f6fc]"
              : "text-[#9198a1] hover:bg-[#161b22] hover:text-[#c9d1d9]"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          {tr("sidebar.dashboard")}
        </button>
        <button
          onClick={onTasks}
          className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
            showTasks
              ? "bg-[#1c2128] text-[#f0f6fc]"
              : "text-[#9198a1] hover:bg-[#161b22] hover:text-[#c9d1d9]"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {tr("sidebar.tasks")}
        </button>
      </div>

      {/* Properties label + add */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <span className="text-xs font-medium text-[#9198a1]">{tr("sidebar.properties")}</span>
        <button
          onClick={() => setShowPropertyInput(!showPropertyInput)}
          className="rounded-md p-1 text-[#9198a1] hover:bg-[#1c2128] hover:text-[#f0f6fc] transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* Add Property Input */}
      {showPropertyInput && (
        <div className="px-3 pb-2">
          <form onSubmit={(e) => { e.preventDefault(); handleAddProperty(); }} className="flex gap-1.5">
            <input
              placeholder={tr("sidebar.propertyPlaceholder")}
              value={newPropertyName}
              onChange={(e) => setNewPropertyName(e.target.value)}
              className="h-8 flex-1 rounded-md border border-[#30363d] bg-[#0d1117] px-2.5 text-sm text-[#f0f6fc] placeholder-[#7d8590] outline-none focus:border-[#58a6ff]"
              autoFocus
            />
            <Button type="submit" size="sm" className="h-8 rounded-md bg-[#238636] px-3 text-xs font-medium text-white hover:bg-[#2ea043]">
              {tr("common.add")}
            </Button>
          </form>
        </div>
      )}

      {/* Property List */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-1">
          {properties.length === 0 && (
            <p className="px-3 py-8 text-center text-xs text-[#7d8590]">
              {tr("sidebar.noProperties")}
            </p>
          )}

          {properties.map((property) => {
            const isSelected = property.id === selectedPropertyId;
            const color = getColor(property.id);

            return (
              <div key={property.id}>
                {/* Property Item */}
                <div
                  className={`group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-colors ${
                    isSelected
                      ? "bg-[#1c2128] text-[#f0f6fc]"
                      : "text-[#c9d1d9] hover:bg-[#161b22]"
                  }`}
                  onClick={() => onSelectProperty(property.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <span className="truncate text-sm">{property.name}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm("Delete this property? This cannot be undone.")) onDeleteProperty(property.id); }}
                    className="shrink-0 rounded p-0.5 opacity-0 transition-all hover:text-[#f85149] group-hover:opacity-100"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Reservations */}
                {isSelected && (
                  <div className="ml-3 mt-0.5 mb-1 border-l border-[#21262d] pl-3">
                    {property.reservations.map((res: Reservation) => {
                      const isResSelected = res.id === selectedReservationId;
                      return (
                        <div
                          key={res.id}
                          className={`group/res flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 transition-colors ${
                            isResSelected
                              ? "bg-[#1c2128] text-[#f0f6fc]"
                              : "text-[#9198a1] hover:bg-[#161b22] hover:text-[#c9d1d9]"
                          }`}
                          onClick={() => onSelectReservation(res.id)}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm">{res.name}</span>
                              <span className={`shrink-0 rounded px-1 py-px text-xs font-bold ${
                                res.platform === "booking"
                                  ? "bg-[#003580]/30 text-[#79c0ff]"
                                  : "bg-[#FF5A5F]/15 text-[#f78166]"
                              }`}>
                                {res.platform === "booking" ? "B" : "A"}
                              </span>
                            </div>
                            <div className="text-xs text-[#7d8590]">
                              {formatDate(res.checkIn)} — {formatDate(res.checkOut)}
                              {res._count && res._count.guests > 0 && (
                                <span> · {res._count.guests}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (confirm("Delete this reservation? This cannot be undone.")) onDeleteReservation(res.id); }}
                            className="shrink-0 rounded p-0.5 opacity-0 transition-all hover:text-[#f85149] group-hover/res:opacity-100"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}

                    {/* Add Reservation Form */}
                    {showReservationForm === property.id ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleAddReservation(property.id); }}
                        className="space-y-2 rounded-md bg-[#161b22] p-2.5 mt-1"
                      >
                        <input
                          placeholder={tr("sidebar.guestName")}
                          value={resName}
                          onChange={(e) => setResName(e.target.value)}
                          className="h-7 w-full rounded border border-[#30363d] bg-[#0d1117] px-2 text-xs text-[#f0f6fc] placeholder-[#7d8590] outline-none focus:border-[#58a6ff]"
                          autoFocus
                        />
                        <div className="flex rounded-md bg-[#0d1117] border border-[#30363d] p-0.5">
                          {(["airbnb", "booking"] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setResPlatform(p)}
                              className={`flex-1 rounded py-1 text-xs font-medium transition-all ${
                                resPlatform === p
                                  ? p === "airbnb"
                                    ? "bg-[#FF5A5F]/15 text-[#f78166]"
                                    : "bg-[#003580]/25 text-[#79c0ff]"
                                  : "text-[#7d8590] hover:text-[#9198a1]"
                              }`}
                            >
                              {p === "airbnb" ? "Airbnb" : "Booking"}
                            </button>
                          ))}
                        </div>
                        <DateSlider
                          checkIn={resCheckIn}
                          checkOut={resCheckOut}
                          onChangeCheckIn={setResCheckIn}
                          onChangeCheckOut={setResCheckOut}
                          compact
                        />
                        <div className="flex gap-1.5">
                          <Button type="submit" size="sm" className="h-7 flex-1 rounded bg-[#238636] text-xs text-white hover:bg-[#2ea043]">
                            {tr("common.add")}
                          </Button>
                          <button type="button" onClick={() => setShowReservationForm(null)}
                            className="h-7 rounded px-2.5 text-xs text-[#9198a1] hover:text-[#f0f6fc]">
                            {tr("common.cancel")}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowReservationForm(property.id)}
                        className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-[#7d8590] transition-colors hover:bg-[#161b22] hover:text-[#9198a1]"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        {tr("sidebar.addReservation")}
                      </button>
                    )}

                    {/* Calendar Sync button */}
                    <button
                      onClick={onCalendarSync}
                      className={`flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                        showCalendarSync
                          ? "bg-[#1c2128] text-[#58a6ff]"
                          : "text-[#7d8590] hover:bg-[#161b22] hover:text-[#9198a1]"
                      }`}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      {tr("sidebar.calendarSync")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Bottom: language + user + settings + logout */}
      <div className="border-t border-[#21262d] px-3 py-3 space-y-1">
        {/* Language selector — one button per supported locale, joined
            by | dividers. Adding a 3rd locale auto-renders a 3rd
            button; previously hardcoded EN/RU. */}
        <div className="flex items-center justify-center gap-1 px-3 py-1">
          {SUPPORTED_LOCALES.map((loc, idx) => (
            <span key={loc} className="contents">
              {idx > 0 && <span className="text-[#30363d]">|</span>}
              <button
                onClick={() => setLocale(loc)}
                className={`rounded px-2 py-0.5 text-xs transition-colors ${locale === loc ? "bg-[#1c2128] text-[#f0f6fc]" : "text-[#7d8590] hover:text-[#c9d1d9]"}`}
              >
                {loc.toUpperCase()}
              </button>
            </span>
          ))}
        </div>
        <button
          onClick={onSettings}
          className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
            showSettings ? "bg-[#1c2128] text-[#f0f6fc]" : "text-[#9198a1] hover:bg-[#161b22] hover:text-[#c9d1d9]"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {tr("sidebar.settings")}
        </button>
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-xs text-[#7d8590]">{username}</span>
          <button
            onClick={onLogout}
            className="text-xs text-[#7d8590] hover:text-[#f85149] transition-colors"
          >
            {tr("sidebar.logout")}
          </button>
        </div>
      </div>
    </div>
  );
}
