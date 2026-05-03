"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Property, CalendarLink } from "@/lib/types";
import { computeSyncHealth } from "./sync-health";
import { toDateStr } from "./utils";

interface CalendarToolbarProps {
  property: Property;
  links: CalendarLink[];
  syncing: boolean;
  overrideMode: boolean;
  exportCopied: boolean;
  today: Date;
  onSyncNow: () => void;
  onToggleOverrideMode: () => void;
  onExport: () => void;
  onAddReservation: (data: {
    name: string;
    checkIn: string;
    checkOut: string;
    platform: string;
    propertyId: number;
  }) => void;
}

export function CalendarToolbar({
  property,
  links,
  syncing,
  overrideMode,
  exportCopied,
  today,
  onSyncNow,
  onToggleOverrideMode,
  onExport,
  onAddReservation,
}: CalendarToolbarProps) {
  const { t, locale } = useI18n();
  const syncHealth = useMemo(() => computeSyncHealth(links, locale), [links, locale]);

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-[#e8e8ec]">{property.name}</h1>
          <button
            onClick={onSyncNow}
            disabled={syncing}
            title={locale === "ru" ? "Синхронизировать сейчас" : "Sync now"}
            className="rounded-md p-1.5 text-[#a0a0a8] transition-colors hover:bg-[#1e1e22] hover:text-[#e8e8ec] disabled:opacity-50"
          >
            <svg className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
        <p className="mt-0.5 text-sm text-[#a0a0a8]">
          {property.reservations.length} {locale === "ru" ? "бронирований" : (property.reservations.length !== 1 ? "reservations" : "reservation")}
        </p>
        {syncHealth && (
          <div
            className="mt-1 flex items-center gap-1.5 text-xs"
            title={syncHealth.ok ? syncHealth.message : `${locale === "ru" ? "Ошибка синхронизации:" : "Sync error:"} ${syncHealth.message}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${syncHealth.ok ? "bg-[#34d399]" : "bg-[#f87171]"}`} />
            <span className={syncHealth.ok ? "text-[#71717a]" : "text-[#f87171]"}>
              {syncHealth.ok ? syncHealth.message : `${locale === "ru" ? "Ошибка синхр.:" : "Sync error:"} ${syncHealth.message.slice(0, 60)}`}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleOverrideMode}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
            overrideMode
              ? "border-[#da3633] bg-[#da3633]/10 text-[#ef4444] hover:bg-[#da3633]/20"
              : "border-[#333338] bg-[#27272b] text-[#d4d4d8] hover:bg-[#333338]"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          {overrideMode ? t("calendar.doneEditing") : t("calendar.editDates")}
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-md border border-[#333338] bg-[#27272b] px-3 py-2 text-sm text-[#d4d4d8] transition-colors hover:bg-[#333338]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          {exportCopied ? t("common.copied") : t("calendar.export")}
        </button>
        <button
          onClick={() => {
            const name = prompt(t("calendar.guestNamePrompt"));
            if (name) {
              onAddReservation({
                name,
                checkIn: toDateStr(today),
                checkOut: toDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4)),
                platform: "airbnb",
                propertyId: property.id,
              });
            }
          }}
          className="flex items-center gap-1.5 rounded-md bg-[#ff385c] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e0294d]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t("calendar.newReservation")}
        </button>
      </div>
    </div>
  );
}
