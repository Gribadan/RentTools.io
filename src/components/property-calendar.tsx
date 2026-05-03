"use client";

import { useState, useMemo } from "react";
import type { Property } from "@/lib/types";
import type { ExtendableBooking } from "@/components/date-actions-popover";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { CalendarNavigation } from "@/components/calendar/calendar-navigation";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarDatePopover } from "@/components/calendar/calendar-date-popover";
import { AgendaList } from "@/components/calendar/agenda-list";
import { ConflictBanner } from "@/components/calendar/conflict-banner";
import { OverrideBanner } from "@/components/calendar/override-banner";
import { useCalendarFetch } from "@/components/calendar/use-calendar-fetch";
import { useCalendarData } from "@/components/calendar/use-calendar-data";
import { buildCalendarExportText } from "@/components/calendar/calendar-export";
import { addDaysStr } from "@/components/calendar/utils";
import { useI18n } from "@/lib/i18n/context";

interface PropertyCalendarProps {
  property: Property;
  onSelectReservation: (id: number) => void;
  onAddReservation: (data: {
    name: string;
    checkIn: string;
    checkOut: string;
    platform: string;
    propertyId: number;
  }) => void;
}

export function PropertyCalendar({
  property,
  onSelectReservation,
  onAddReservation,
}: PropertyCalendarProps) {
  const { locale } = useI18n();
  const [monthOffset, setMonthOffset] = useState(0);
  const [overrideMode, setOverrideMode] = useState(false);
  const [popoverDate, setPopoverDate] = useState<string | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);
  const [exportCopied, setExportCopied] = useState(false);

  const { syncedEvents, links, overrides, loadingEvents, syncing, refetchOverrides, handleSyncNow } =
    useCalendarFetch(property.id);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currentMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset]
  );
  const monthLabel = currentMonth.toLocaleDateString(
    locale === "ru" ? "ru-RU" : "en",
    { month: "long", year: "numeric" }
  );

  const data = useCalendarData(property, syncedEvents, links, overrides);

  const closePopover = () => {
    setPopoverDate(null);
    setPopoverAnchor(null);
  };

  const setOverride = async (dateStr: string, type: "open" | "closed") => {
    await fetch(`/api/date-overrides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: property.id, date: dateStr, type }),
    });
    await refetchOverrides();
    closePopover();
  };

  const deleteOverride = async (dateStr: string) => {
    await fetch(`/api/date-overrides?propertyId=${property.id}&date=${dateStr}`, { method: "DELETE" });
    await refetchOverrides();
    closePopover();
  };

  const extendBooking = async (dateStr: string, booking: ExtendableBooking) => {
    await fetch(`/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: booking.name,
        checkIn: dateStr,
        checkOut: addDaysStr(dateStr, 1),
        platform: booking.platform,
        propertyId: property.id,
        linkedEventUid: booking.eventUid,
      }),
    });
    closePopover();
    window.location.reload();
  };

  const handleExport = () => {
    const text = buildCalendarExportText({
      property, monthLabel, today, syncedEvents, links,
      bars: data.bars,
      bufferDates: data.bufferDates,
      potentialDates: data.potentialDates,
      unbookableDates: data.unbookableDates,
      conflicts: data.conflicts,
    });
    navigator.clipboard.writeText(text);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <CalendarToolbar
        property={property}
        links={links}
        syncing={syncing}
        overrideMode={overrideMode}
        exportCopied={exportCopied}
        today={today}
        onSyncNow={handleSyncNow}
        onToggleOverrideMode={() => setOverrideMode(m => !m)}
        onExport={handleExport}
        onAddReservation={onAddReservation}
      />
      <ConflictBanner conflicts={data.conflicts} />
      {overrideMode && <OverrideBanner />}
      <div className={`rounded-lg border bg-[#18181b] overflow-hidden ${overrideMode ? "border-[#da3633]/30" : "border-[#27272b]"}`}>
        <CalendarNavigation
          monthLabel={monthLabel}
          monthOffset={monthOffset}
          loading={loadingEvents}
          onPrev={() => setMonthOffset(o => o - 1)}
          onNext={() => setMonthOffset(o => o + 1)}
          onToday={() => setMonthOffset(0)}
        />
        <CalendarLegend
          minNights={property.minNights || 3}
          hasOverrides={data.openOverrides.size > 0 || data.closedOverrides.size > 0}
        />
        <CalendarGrid
          year={currentMonth.getFullYear()}
          month={currentMonth.getMonth()}
          today={today}
          minNights={property.minNights || 3}
          checkInTime={property.checkInTime || "14:00"}
          checkOutTime={property.checkOutTime || "12:00"}
          bars={data.bars}
          bufferDates={data.bufferDates}
          potentialDates={data.potentialDates}
          unbookableDates={data.unbookableDates}
          sameDayCleaningDates={data.sameDayCleaningDates}
          conflictDates={data.conflictDates}
          openOverrides={data.openOverrides}
          closedOverrides={data.closedOverrides}
          overrideMode={overrideMode}
          onSelectReservation={onSelectReservation}
          onCellClick={(dateStr, rect) => {
            if (!overrideMode) return;
            setPopoverDate(dateStr);
            setPopoverAnchor(rect);
          }}
        />
      </div>
      <AgendaList bars={data.bars} today={today} onSelectReservation={onSelectReservation} />
      {popoverDate && popoverAnchor && (
        <CalendarDatePopover
          date={popoverDate}
          anchorRect={popoverAnchor}
          bars={data.bars}
          bufferDates={data.bufferDates}
          potentialDates={data.potentialDates}
          sameDayCleaningDates={data.sameDayCleaningDates}
          unbookableDates={data.unbookableDates}
          openOverrides={data.openOverrides}
          closedOverrides={data.closedOverrides}
          syncedEvents={syncedEvents}
          reservations={property.reservations}
          onClose={closePopover}
          onSetOverride={(type) => setOverride(popoverDate, type)}
          onRemoveOverride={() => deleteOverride(popoverDate)}
          onExtendBooking={(b) => extendBooking(popoverDate, b)}
        />
      )}
    </div>
  );
}
