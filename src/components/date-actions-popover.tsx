"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n/context";

export interface DateStatus {
  hasBar: boolean;
  isBuffer: boolean;
  isPotential: boolean;
  isSameDayCleaning: boolean;
  isUnbookable: boolean;
  isOpenOverride: boolean;
  isClosedOverride: boolean;
  isManualCleaning: boolean;
}

export interface DateBarInfo {
  name: string;
  platform: string;
  role: "checkout" | "checkin" | "midstay" | "fullday";
  reservationId?: number;
  eventUid?: string;
  linkedEventUid?: string;
}

export interface ExtendableBooking {
  name: string;
  platform: string;
  eventUid?: string;
  side: "before" | "after";
}

interface BulkCounts {
  booked: number;
  openOverride: number;
  closedOverride: number;
  cleaningOverride: number;
}

interface DateActionsPanelProps {
  /** Always at least one entry. Single = 1, bulk = 2+. */
  selectedDates: string[];
  /** When exactly one date is selected, single-date detail. */
  singleDate: string | null;
  singleDateBars: DateBarInfo[];
  singleExtendable: ExtendableBooking[];
  singleStatus: DateStatus | null;
  /** Aggregate flags across the entire selection — drives the bulk
   *  action list when 2+ dates are selected. */
  bulkCounts: BulkCounts;
  onClose: () => void;
  onToggleDate: (dateStr: string) => void;
  onCloseDate: () => void;
  onOpenDate: () => void;
  onScheduleCleaning: () => void;
  onRemoveOverride: () => void;
  onExtendBooking: (booking: ExtendableBooking) => void;
  onCreateReservation: (data: { name: string; platform: string }) => void;
}

type ActionKind =
  | "block"
  | "scheduleCleaning"
  | "openForBooking"
  | "removeOverride"
  | "removeBlock"
  | "removeCleaning"
  | "createReservation";

interface ResolvedAction {
  kind: ActionKind;
  label: string;
  description?: string;
  tone: "neutral" | "block" | "open" | "cleaning" | "primary";
  onClick: () => void;
}

export function DateActionsPopover({
  selectedDates,
  singleDate,
  singleDateBars,
  singleExtendable,
  singleStatus,
  bulkCounts,
  onClose,
  onToggleDate,
  onCloseDate,
  onOpenDate,
  onScheduleCleaning,
  onRemoveOverride,
  onExtendBooking,
  onCreateReservation,
}: DateActionsPanelProps) {
  const { t, locale } = useI18n();
  const popRef = useRef<HTMLDivElement>(null);
  const [creating, setCreating] = useState(false);
  const [resName, setResName] = useState("");
  const [resPlatform, setResPlatform] = useState<string>("airbnb");
  const [submitting, setSubmitting] = useState(false);

  // Reset the create-reservation form whenever the selection changes
  // (e.g. user added another date). Otherwise typed name would carry
  // over into a different selection state.
  useEffect(() => {
    setCreating(false);
    setResName("");
    setResPlatform("airbnb");
    setSubmitting(false);
  }, [selectedDates.join(",")]);

  // Are the selected dates contiguous? Determines whether
  // "Create reservation" makes sense (only contiguous can be a single
  // booking). Sorted by buildDateBars caller already.
  const isContiguous = (() => {
    if (selectedDates.length <= 1) return true;
    for (let i = 1; i < selectedDates.length; i++) {
      const prev = new Date(selectedDates[i - 1] + "T12:00:00Z").getTime();
      const cur = new Date(selectedDates[i] + "T12:00:00Z").getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      if (Math.round((cur - prev) / dayMs) !== 1) return false;
    }
    return true;
  })();

  const allUnbooked = bulkCounts.booked === 0;

  // Single-date mode header status text — matches old per-date popup.
  const singleStatusText = (() => {
    if (!singleStatus) return "";
    if (singleStatus.hasBar) {
      if (singleDateBars.length > 1) {
        return locale === "ru"
          ? `${singleDateBars.length} брони — пересменка`
          : `${singleDateBars.length} stays — turnover`;
      }
      return t("dateActions.statusBooked", { name: singleDateBars[0]?.name || "—" });
    }
    if (singleStatus.isOpenOverride) return t("dateActions.statusOpen");
    if (singleStatus.isManualCleaning) return locale === "ru" ? "Ручная уборка" : "Manual cleaning";
    if (singleStatus.isClosedOverride) return t("dateActions.statusClosed");
    if (singleStatus.isBuffer) return t("dateActions.statusCleaning");
    if (singleStatus.isSameDayCleaning) return t("dateActions.statusCleaning");
    if (singleStatus.isPotential) return t("dateActions.statusPotential");
    if (singleStatus.isUnbookable) return t("dateActions.statusUnbookable");
    return t("dateActions.statusFree");
  })();

  const isLinkedPair = (a: DateBarInfo, b: DateBarInfo) =>
    (!!a.eventUid && a.eventUid === b.linkedEventUid) ||
    (!!b.eventUid && b.eventUid === a.linkedEventUid);

  const cleaningBetweenIndex = (() => {
    for (let i = 0; i < singleDateBars.length - 1; i++) {
      const a = singleDateBars[i];
      const b = singleDateBars[i + 1];
      if (a.role === "checkout" && b.role === "checkin" && !isLinkedPair(a, b)) {
        return i;
      }
    }
    return -1;
  })();

  const formatHeaderDate = (s: string) =>
    new Date(s + "T12:00:00").toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const formatShort = (s: string) =>
    new Date(s + "T12:00:00").toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", {
      day: "2-digit",
      month: "short",
    });

  // Single-date actions (per-state, same logic as before).
  const singleActions: ResolvedAction[] = (() => {
    if (!singleStatus) return [];
    const lBlock = locale === "ru" ? "Заблокировать дату" : "Block this date";
    const lBlockDesc = locale === "ru" ? "Запретить новые брони. Без отметки уборки." : "Stop new bookings. No cleaning chip.";
    const lSchedule = locale === "ru" ? "Запланировать уборку" : "Schedule cleaning";
    const lScheduleDesc = locale === "ru" ? "Заблокировать дату и пометить как уборку." : "Block the date and mark it as a cleaning slot.";
    const lOpen = locale === "ru" ? "Сделать доступной" : "Make available for booking";
    const lOpenDesc = locale === "ru" ? "Игнорировать буфер уборки / минимум ночей." : "Ignore buffer / min-nights for this date.";
    const lUnblock = locale === "ru" ? "Разблокировать" : "Unblock this date";
    const lRemoveCleaning = locale === "ru" ? "Снять уборку" : "Remove cleaning";
    const lRemoveOverride = locale === "ru" ? "Сбросить ручное состояние" : "Reset to default";
    const lRemoveOverrideDesc = locale === "ru" ? "Вернуть автоматическое поведение для этой даты." : "Return this date to its auto-detected state.";
    const lCreate = locale === "ru" ? "Создать бронь" : "Create reservation";
    const lCreateDesc = locale === "ru" ? "Добавить бронь, начинающуюся в этот день." : "Add a reservation starting on this date.";
    const createAction: ResolvedAction = { kind: "createReservation", label: lCreate, description: lCreateDesc, tone: "primary", onClick: () => setCreating(true) };

    if (singleStatus.hasBar) {
      const turnoverNeedsCleaning = cleaningBetweenIndex >= 0 && !singleStatus.isManualCleaning;
      const lScheduleConfirm = locale === "ru" ? "Подтвердить уборку между бронированиями." : "Confirm a cleaning slot between the two stays.";
      const lRemoveCleaningDesc = locale === "ru" ? "Вернуть автоматическое определение." : "Go back to the auto-detected hint.";
      if (turnoverNeedsCleaning) return [{ kind: "scheduleCleaning", label: lSchedule, description: lScheduleConfirm, tone: "cleaning", onClick: onScheduleCleaning }];
      if (singleStatus.isManualCleaning) return [{ kind: "removeCleaning", label: lRemoveCleaning, description: lRemoveCleaningDesc, tone: "open", onClick: onRemoveOverride }];
      return [];
    }
    if (singleStatus.isManualCleaning) {
      return [createAction, { kind: "removeCleaning", label: lRemoveCleaning, description: lRemoveOverrideDesc, tone: "open", onClick: onRemoveOverride }, { kind: "block", label: lBlock, description: lBlockDesc, tone: "block", onClick: onCloseDate }];
    }
    if (singleStatus.isClosedOverride) {
      return [createAction, { kind: "removeBlock", label: lUnblock, description: lRemoveOverrideDesc, tone: "open", onClick: onRemoveOverride }];
    }
    if (singleStatus.isOpenOverride) {
      return [createAction, { kind: "removeOverride", label: lRemoveOverride, description: lRemoveOverrideDesc, tone: "neutral", onClick: onRemoveOverride }, { kind: "block", label: lBlock, description: lBlockDesc, tone: "block", onClick: onCloseDate }, { kind: "scheduleCleaning", label: lSchedule, description: lScheduleDesc, tone: "cleaning", onClick: onScheduleCleaning }];
    }
    if (singleStatus.isBuffer || singleStatus.isSameDayCleaning || singleStatus.isUnbookable || singleStatus.isPotential) {
      return [createAction, { kind: "openForBooking", label: lOpen, description: lOpenDesc, tone: "open", onClick: onOpenDate }];
    }
    return [createAction, { kind: "block", label: lBlock, description: lBlockDesc, tone: "block", onClick: onCloseDate }, { kind: "scheduleCleaning", label: lSchedule, description: lScheduleDesc, tone: "cleaning", onClick: onScheduleCleaning }];
  })();

  // Bulk-mode actions: simpler — operate on the whole selection.
  const bulkActions: ResolvedAction[] = (() => {
    const lBlockAll = locale === "ru" ? `Заблокировать все (${selectedDates.length})` : `Block all (${selectedDates.length})`;
    const lScheduleAll = locale === "ru" ? `Запланировать уборку (${selectedDates.length})` : `Schedule cleaning (${selectedDates.length})`;
    const lOpenAll = locale === "ru" ? `Сделать доступными (${selectedDates.length})` : `Make available (${selectedDates.length})`;
    const lResetAll = locale === "ru" ? `Сбросить переопределения (${selectedDates.length})` : `Reset overrides (${selectedDates.length})`;
    const lCreate = locale === "ru" ? `Создать бронь на ${selectedDates.length} ${selectedDates.length === 1 ? "ночь" : "ночей"}` : `Create reservation (${selectedDates.length} ${selectedDates.length === 1 ? "night" : "nights"})`;
    const lCreateDesc = locale === "ru" ? "Одна бронь на все выбранные дни." : "One reservation covering all selected days.";

    const out: ResolvedAction[] = [];

    if (allUnbooked && isContiguous) {
      out.push({ kind: "createReservation", label: lCreate, description: lCreateDesc, tone: "primary", onClick: () => setCreating(true) });
    }
    if (allUnbooked) {
      out.push({ kind: "block", label: lBlockAll, tone: "block", onClick: onCloseDate });
      out.push({ kind: "scheduleCleaning", label: lScheduleAll, tone: "cleaning", onClick: onScheduleCleaning });
      out.push({ kind: "openForBooking", label: lOpenAll, tone: "open", onClick: onOpenDate });
    }
    if (bulkCounts.openOverride + bulkCounts.closedOverride + bulkCounts.cleaningOverride > 0) {
      out.push({ kind: "removeOverride", label: lResetAll, tone: "neutral", onClick: onRemoveOverride });
    }
    return out;
  })();

  const toneClass = (tone: ResolvedAction["tone"]) => {
    switch (tone) {
      case "primary":
        return "bg-[var(--m-accent)] text-white hover:bg-[var(--m-accent-2)]";
      case "block":
        return "hover:bg-rose-500/10 hover:text-rose-500";
      case "open":
        return "hover:bg-emerald-500/10 hover:text-emerald-500";
      case "cleaning":
        return "hover:bg-[var(--cleaning-bg)] hover:text-[var(--cleaning-fg)]";
      default:
        return "hover:bg-[var(--bg-3)]";
    }
  };

  const iconFor = (kind: ActionKind) => {
    switch (kind) {
      case "createReservation":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        );
      case "block":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        );
      case "scheduleCleaning":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "openForBooking":
      case "removeBlock":
      case "removeCleaning":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        );
      case "removeOverride":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        );
    }
  };

  const submitCreate = async () => {
    const finalName = resName.trim();
    if (!finalName) return;
    setSubmitting(true);
    try {
      onCreateReservation({ name: finalName, platform: resPlatform });
    } finally {
      setSubmitting(false);
    }
  };

  const singleStatusBadgeClass = !singleStatus
    ? ""
    : singleStatus.hasBar
      ? "bg-[var(--m-accent)]/10 text-[var(--m-accent)]"
      : singleStatus.isOpenOverride
        ? "bg-emerald-500/10 text-emerald-500"
        : singleStatus.isManualCleaning
          ? "bg-[var(--cleaning-bg)] text-[var(--cleaning-fg)]"
          : singleStatus.isClosedOverride
            ? "bg-rose-500/10 text-rose-500"
            : (singleStatus.isBuffer || singleStatus.isSameDayCleaning)
              ? "bg-[var(--cleaning-bg)] text-[var(--cleaning-fg)]"
              : singleStatus.isPotential
                ? "bg-[var(--ink)]/5 text-[var(--ink-2)]"
                : singleStatus.isUnbookable
                  ? "bg-[var(--ink-4)]/10 text-[var(--ink-3)]"
                  : "bg-emerald-500/10 text-emerald-500";

  const renderActionsList = (actions: ResolvedAction[]) =>
    actions.length === 0 ? (
      <div className="px-3 py-2 text-xs text-[var(--ink-4)]">
        {locale === "ru" ? "Нет доступных действий." : "No actions available."}
      </div>
    ) : (
      actions.map((a) => (
        <button
          key={a.kind + a.label}
          onClick={a.onClick}
          className={`w-full flex items-start gap-2.5 rounded-md px-3 py-2.5 text-left transition-colors ${a.tone === "primary" ? "" : "text-[var(--ink)]"} ${toneClass(a.tone)}`}
        >
          <span className={`mt-0.5 shrink-0 ${a.tone === "primary" ? "text-white" : ""}`}>{iconFor(a.kind)}</span>
          <span className="flex-1 min-w-0">
            <span className={`block text-sm font-medium ${a.tone === "primary" ? "text-white" : ""}`}>{a.label}</span>
            {a.description && (
              <span className={`block text-[11px] mt-0.5 leading-snug ${a.tone === "primary" ? "text-white/80" : "text-[var(--ink-4)]"}`}>{a.description}</span>
            )}
          </span>
        </button>
      ))
    );

  return createPortal(
    <div
      ref={popRef}
      className="editorial fixed top-0 right-0 bottom-0 z-[100] flex w-full sm:w-[400px] flex-col border-l border-[var(--line-2)] bg-[var(--bg)] shadow-2xl shadow-black/30 animate-slide-in-right"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
        <div className="min-w-0 flex-1">
          {singleDate ? (
            <>
              <div className="text-xs uppercase tracking-wide text-[var(--ink-4)]">{t("dateActions.title")}</div>
              <div className="mt-0.5 text-base font-semibold text-[var(--ink)]">{formatHeaderDate(singleDate)}</div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-[var(--ink-4)]">{t("dateActions.status")}:</span>
                <span className={`rounded px-1.5 py-0.5 font-medium ${singleStatusBadgeClass}`}>{singleStatusText}</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs uppercase tracking-wide text-[var(--ink-4)]">
                {locale === "ru" ? "Выбрано дат" : "Selected dates"}
              </div>
              <div className="mt-0.5 text-base font-semibold text-[var(--ink)]">
                {selectedDates.length} {locale === "ru" ? "дн." : selectedDates.length === 1 ? "day" : "days"}
                {isContiguous && selectedDates.length > 1 && (
                  <span className="ml-2 text-sm font-normal text-[var(--ink-3)]">
                    {formatShort(selectedDates[0])} → {formatShort(selectedDates[selectedDates.length - 1])}
                  </span>
                )}
              </div>
              <div className="mt-2 text-[11px] text-[var(--ink-3)]">
                {bulkCounts.booked > 0
                  ? (locale === "ru"
                    ? `${bulkCounts.booked} с бронями — массовые действия отключены`
                    : `${bulkCounts.booked} booked — bulk actions disabled`)
                  : isContiguous
                    ? (locale === "ru" ? "Дни идут подряд" : "Contiguous range")
                    : (locale === "ru" ? "Не подряд" : "Non-contiguous")}
              </div>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label={locale === "ru" ? "Закрыть" : "Close"}
          className="shrink-0 rounded-full p-1.5 text-[var(--ink-3)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)] transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
        {/* Single-date day timeline */}
        {singleDate && singleDateBars.length > 0 && (
          <div className="border-b border-[var(--line)] px-4 py-3 space-y-2">
            {singleDateBars.map((b, i) => {
              const platformColor = b.platform === "booking" ? "#003580" : "#ff385c";
              const platformLabel = b.platform === "booking" ? "Booking" : b.platform === "airbnb" ? "Airbnb" : b.platform;
              const roleLabel = b.role === "checkout"
                ? (locale === "ru" ? "выезжает" : "checking out")
                : b.role === "checkin"
                  ? (locale === "ru" ? "заезжает" : "checking in")
                  : b.role === "fullday"
                    ? (locale === "ru" ? "однодневная бронь" : "single-day stay")
                    : (locale === "ru" ? "проживает" : "staying");
              return (
                <div key={`bar-${i}`}>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white" style={{ backgroundColor: platformColor }}>{platformLabel}</span>
                    <span className="flex-1 min-w-0 truncate text-sm font-medium text-[var(--ink)]">{b.name}</span>
                  </div>
                  <div className="ml-[58px] mt-0.5 text-[11px] text-[var(--ink-3)]">{roleLabel}</div>
                  {i === cleaningBetweenIndex && (
                    <div className="my-2 flex items-center gap-2 rounded-md border border-[var(--cleaning-border)] bg-[var(--cleaning-bg)] px-2.5 py-1.5">
                      <svg className="h-4 w-4 text-[var(--cleaning-fg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium text-[var(--cleaning-fg)]">
                        {singleStatus?.isManualCleaning
                          ? (locale === "ru" ? "Уборка подтверждена" : "Cleaning scheduled")
                          : (locale === "ru" ? "Нужна уборка между бронями" : "Cleaning required between stays")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Multi-date selection list — chips with toggle to remove */}
        {!singleDate && (
          <div className="border-b border-[var(--line)] px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {selectedDates.map((d) => (
                <button
                  key={d}
                  onClick={() => onToggleDate(d)}
                  className="group inline-flex items-center gap-1 rounded-full border border-[var(--m-accent)]/30 bg-[var(--m-accent)]/10 px-2 py-1 text-[11px] font-medium text-[var(--m-accent)] hover:bg-[var(--m-accent)]/20 transition-colors"
                  title={locale === "ru" ? "Убрать из выделения" : "Remove from selection"}
                >
                  {formatShort(d)}
                  <svg className="h-3 w-3 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create-reservation form (shared by single + bulk modes) */}
        {creating ? (
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)] mb-1.5">
                {locale === "ru" ? "Имя гостя" : "Guest name"}
              </label>
              <input
                autoFocus
                value={resName}
                onChange={(e) => setResName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitCreate();
                  }
                }}
                placeholder={locale === "ru" ? "Иван Петров" : "Jane Doe"}
                className="h-10 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-3 text-sm text-[var(--ink)] placeholder-[var(--ink-4)] outline-none focus:border-[var(--m-accent)] focus:ring-1 focus:ring-[var(--m-accent)]/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)] mb-1.5">
                {locale === "ru" ? "Платформа" : "Platform"}
              </label>
              <div className="flex gap-2">
                {[
                  { code: "airbnb", label: "Airbnb", color: "#ff385c" },
                  { code: "booking", label: "Booking", color: "#003580" },
                  { code: "direct", label: locale === "ru" ? "Напрямую" : "Direct", color: "#6b6b73" },
                ].map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => setResPlatform(p.code)}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                      resPlatform === p.code
                        ? "border-transparent text-white"
                        : "border-[var(--line-2)] bg-[var(--bg-2)] text-[var(--ink-2)] hover:bg-[var(--bg-3)]"
                    }`}
                    style={resPlatform === p.code ? { backgroundColor: p.color } : undefined}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] p-3 text-xs text-[var(--ink-3)]">
              <div>
                <span className="text-[var(--ink-4)]">{locale === "ru" ? "Заезд:" : "Check-in:"}</span>{" "}
                <span className="font-medium text-[var(--ink)]">{formatShort(selectedDates[0])}</span>
              </div>
              <div className="mt-1">
                <span className="text-[var(--ink-4)]">{locale === "ru" ? "Выезд:" : "Check-out:"}</span>{" "}
                <span className="font-medium text-[var(--ink)]">
                  {(() => {
                    const last = selectedDates[selectedDates.length - 1];
                    const d = new Date(last + "T12:00:00");
                    d.setDate(d.getDate() + 1);
                    return d.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", { day: "2-digit", month: "short" });
                  })()}
                </span>{" "}
                <span className="text-[var(--ink-4)]">
                  ({selectedDates.length} {selectedDates.length === 1 ? (locale === "ru" ? "ночь" : "night") : (locale === "ru" ? "ночей" : "nights")})
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Action list */
          <div className="px-2.5 py-2.5">
            {singleDate ? renderActionsList(singleActions) : renderActionsList(bulkActions)}

            {/* Single-date extend booking section (unchanged) */}
            {singleDate && singleStatus && !singleStatus.hasBar && singleExtendable.length > 0 && (
              <div className="mt-2 border-t border-[var(--line)] pt-2">
                <div className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-[var(--ink-4)]">
                  {t("dateActions.extendDesc")}
                </div>
                {singleExtendable.map((b, i) => (
                  <button
                    key={i}
                    onClick={() => onExtendBooking(b)}
                    className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left text-[var(--ink)] hover:bg-[var(--bg-3)]"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded"
                      style={{
                        backgroundColor: b.platform === "booking" ? "#003580" : "#ff385c",
                        backgroundImage: "repeating-linear-gradient(-45deg, transparent 0 3px, rgba(255,255,255,0.25) 3px 4px)",
                      }}
                    />
                    <span className="flex-1 truncate">{b.name}</span>
                    <span className="text-[10px] text-[var(--ink-4)]">{b.side === "before" ? "→" : "←"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky footer for the create form */}
      {creating && (
        <div className="border-t border-[var(--line)] px-5 py-3 flex gap-2">
          <button
            type="button"
            onClick={() => setCreating(false)}
            disabled={submitting}
            className="flex-1 rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--ink-2)] hover:bg-[var(--bg-3)] transition-colors disabled:opacity-50"
          >
            {t("common.cancel") || (locale === "ru" ? "Отмена" : "Cancel")}
          </button>
          <button
            type="button"
            onClick={submitCreate}
            disabled={submitting || !resName.trim()}
            className="flex-1 rounded-md bg-[var(--m-accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--m-accent-2)] transition-colors disabled:opacity-50"
          >
            {submitting ? (locale === "ru" ? "Сохраняю…" : "Saving…") : (locale === "ru" ? "Сохранить" : "Save")}
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
