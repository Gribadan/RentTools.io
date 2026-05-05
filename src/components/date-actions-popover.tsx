"use client";

import { useEffect, useRef, useState } from "react";
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
  /** Original stay window of the booking we're appending to —
   *  shown in the panel so the host sees the full context (e.g.
   *  "Iain · May 3 → May 9") instead of the bare iCal SUMMARY. */
  bookingStart: string;
  bookingEnd: string;
  side: "before" | "after";
}

interface BulkCounts {
  booked: number;
  openOverride: number;
  closedOverride: number;
  cleaningOverride: number;
  /** Selected dates that are auto-flagged unavailable by the system
   *  (buffer / same-day cleaning / unbookable / potential cleaning).
   *  Used to decide whether the bulk "Make available" action makes
   *  sense — without this we would show it on already-free dates. */
  autoBlocked: number;
}

interface DateActionsPanelProps {
  /** Always at least one entry. Single = 1, bulk = 2+. */
  selectedDates: string[];
  /** When exactly one date is selected, single-date detail. */
  singleDate: string | null;
  singleDateBars: DateBarInfo[];
  /** Bookings the WHOLE selection could be appended to (extend
   *  before / after). For a single-date selection this is the same
   *  set the per-date popup used to compute. For a multi-date
   *  contiguous selection these are bookings whose start equals
   *  last+1 or whose end equals first. */
  extendable: ExtendableBooking[];
  /** Whether the multi-date selection is contiguous — drives whether
   *  Create reservation / Extend booking are offered. */
  isContiguousRange: boolean;
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
  extendable,
  isContiguousRange,
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

  // Use the contiguous-range flag passed in by the wrapper (shared
  // with the extendable computation so they stay consistent).
  const isContiguous = isContiguousRange;

  const allUnbooked = bulkCounts.booked === 0;
  // Has anything in the selection that "Make available" would
  // actually unblock — without this the bulk panel would offer the
  // action on dates that are already free.
  const someNeedsOpening =
    bulkCounts.closedOverride > 0 ||
    bulkCounts.cleaningOverride > 0 ||
    bulkCounts.autoBlocked > 0;

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
      // On a booked day the only meaningful action is around the
      // cleaning chip. Three cases, all surfaced as "Cancel
      // cleaning" with different underlying writes:
      //
      //   * Manual cleaning override → DELETE override (back to
      //     auto-detected state, which on a turnover or end-of-stay
      //     day still shows the Cleaning chip via sameDayCleaning).
      //   * Auto sameDayCleaning chip (turnover OR end-of-stay) →
      //     SET an `open` override that suppresses the auto chip.
      //
      // Previously the turnover branch surfaced "Schedule cleaning"
      // (which writes a cleaning override on top of the existing
      // auto chip) — confusing because cleaning was already shown.
      // Now we collapse to a single Cancel-cleaning action that
      // matches the host's mental model: "the cleaner can't make
      // this day, free it up so I can schedule another day".
      const lRemoveCleaningDesc = locale === "ru" ? "Вернуть автоматическое определение." : "Go back to the auto-detected hint.";
      const lCancelCleaning = locale === "ru" ? "Отменить уборку" : "Cancel cleaning";
      const lCancelCleaningDesc = locale === "ru"
        ? "Освободить дату от уборки — выберите другой день."
        : "Free this date from the cleaning — schedule it on another day.";
      if (singleStatus.isManualCleaning) {
        return [{ kind: "removeCleaning", label: lCancelCleaning, description: lRemoveCleaningDesc, tone: "open", onClick: onRemoveOverride }];
      }
      if (singleStatus.isSameDayCleaning) {
        return [{ kind: "openForBooking", label: lCancelCleaning, description: lCancelCleaningDesc, tone: "open", onClick: onOpenDate }];
      }
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
    // Auto-detected unavailable. Two label flavours:
    //   * Cleaning days (buffer / same-day / potential): "Cancel
    //     cleaning" — the host's mental model is "the cleaner is
    //     not coming this day, schedule it elsewhere".
    //   * Min-nights blocks (unbookable): "Make available" — the
    //     date is locked for booking-fit reasons, no cleaning concept.
    if (singleStatus.isBuffer || singleStatus.isSameDayCleaning || singleStatus.isPotential) {
      const lCancelCleaning = locale === "ru" ? "Отменить уборку" : "Cancel cleaning";
      const lCancelCleaningDesc = locale === "ru"
        ? "Освободить дату — выберите другой день для уборки."
        : "Free up this date — schedule cleaning on another day instead.";
      return [createAction, { kind: "openForBooking", label: lCancelCleaning, description: lCancelCleaningDesc, tone: "open", onClick: onOpenDate }];
    }
    if (singleStatus.isUnbookable) {
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
      // "Make available" only when at least one selected date is
      // actually unavailable — otherwise the action is a no-op on
      // already-free days.
      if (someNeedsOpening) {
        out.push({ kind: "openForBooking", label: lOpenAll, tone: "open", onClick: onOpenDate });
      }
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
        // Sparkles glyph — reads as "make this clean / sparkly"
        // and works for both auto-cleaning and manual scheduling.
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
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

  // Renders inline as a flex sibling of the calendar (no portal). The
  // parent decides positioning — on desktop it's a sticky aside that
  // shares the centered max-w-[1760px] container with the calendar;
  // on mobile it stacks below or replaces the calendar.
  return (
    <div
      ref={popRef}
      className="flex h-full flex-col bg-[var(--bg)] animate-slide-in-right"
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

            {/* Extend booking — works for single-date OR multi-date
                contiguous selection. Each card shows the platform
                pill, the guest name, the original stay window and a
                "Extend by N nights" CTA so the host knows exactly
                what they're appending to before clicking. */}
            {extendable.length > 0 && bulkCounts.booked === 0 && isContiguous && (
              <div className="mt-2 border-t border-[var(--line)] pt-2 px-1.5">
                <div className="px-1.5 py-1.5 text-[11px] uppercase tracking-wide text-[var(--ink-4)]">
                  {locale === "ru" ? "Привязать к существующей броне" : "Link to an existing booking"}
                </div>
                {extendable.map((b, i) => {
                  const platformColor = b.platform === "booking" ? "#003580" : "#ff385c";
                  const platformLabel = b.platform === "booking" ? "Booking" : b.platform === "airbnb" ? "Airbnb" : b.platform;
                  const nights = selectedDates.length;
                  const sideLabel = b.side === "before"
                    ? (locale === "ru" ? "перед заездом" : "before check-in")
                    : (locale === "ru" ? "после выезда" : "after check-out");
                  const nightsLabel = nights === 1
                    ? (locale === "ru" ? "ночь" : "night")
                    : (locale === "ru" ? "ночей" : "nights");
                  return (
                    <button
                      key={i}
                      onClick={() => onExtendBooking(b)}
                      className="w-full mb-1.5 last:mb-0 rounded-lg border border-[var(--line-2)] bg-[var(--bg-2)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-3)]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white"
                          style={{ backgroundColor: platformColor }}
                        >
                          {platformLabel}
                        </span>
                        <span className="flex-1 min-w-0 truncate text-sm font-medium text-[var(--ink)]">{b.name}</span>
                        <svg className="h-3.5 w-3.5 shrink-0 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={b.side === "before" ? "M8.25 4.5l7.5 7.5-7.5 7.5" : "M15.75 19.5L8.25 12l7.5-7.5"} />
                        </svg>
                      </div>
                      <div className="mt-1 text-[11px] text-[var(--ink-3)]">
                        {locale === "ru" ? "Бронь" : "Stay"}: <span className="text-[var(--ink-2)]">{formatShort(b.bookingStart)} → {formatShort(b.bookingEnd)}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] font-medium text-[var(--m-accent)]">
                        {locale === "ru"
                          ? `Добавить ${nights} ${nightsLabel} ${sideLabel}`
                          : `Add ${nights} ${nightsLabel} ${sideLabel}`}
                      </div>
                    </button>
                  );
                })}
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
    </div>
  );
}
