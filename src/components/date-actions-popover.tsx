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
  /** "checkout" — guest checking out (this date is the bar's endDate)
   *  "checkin"  — guest arriving (this date is the bar's startDate)
   *  "midstay"  — date is in the middle of a multi-day stay
   *  "fullday"  — single-day stay where startDate === endDate */
  role: "checkout" | "checkin" | "midstay" | "fullday";
  reservationId?: number;
  eventUid?: string;
  /** UID of the iCal event this bar's reservation extends, when the
   *  reservation was added via "Extend booking" / "Add as extension".
   *  When two abutting bars share an event-uid <-> linked-event-uid
   *  relationship they are the same guest's stay, and we suppress the
   *  "Cleaning required between stays" hint on the boundary date. */
  linkedEventUid?: string;
}

export interface ExtendableBooking {
  name: string;
  platform: string;
  eventUid?: string;
  side: "before" | "after"; // extending before startDate or after endDate
}

interface DateActionsPanelProps {
  date: string;
  status: DateStatus;
  /** All bars touching this date, sorted by role (checkout → midstay
   *  → checkin). The panel renders them in that order so a same-day
   *  turnover surfaces both the leaving guest and the arriving guest,
   *  with a cleaning hint between them. */
  dateBars: DateBarInfo[];
  extendable: ExtendableBooking[];
  onClose: () => void;
  onCloseDate: () => void;
  onOpenDate: () => void;
  onScheduleCleaning: () => void;
  onRemoveOverride: () => void;
  onExtendBooking: (booking: ExtendableBooking) => void;
  /** Create a fresh manual reservation starting on the clicked date.
   *  The panel collects guest name + nights and calls back. */
  onCreateReservation: (data: { name: string; nights: number; platform: string }) => void;
}

// Resolved per-state action set. We compute one of these from the
// DateStatus so the UI doesn't have to chain a thicket of `canX` flags
// at render-time and present overlapping or contradictory buttons.
type ActionKind = "block" | "scheduleCleaning" | "openForBooking" | "removeOverride" | "removeBlock" | "removeCleaning" | "createReservation";

interface ResolvedAction {
  kind: ActionKind;
  label: string;
  description?: string;
  tone: "neutral" | "block" | "open" | "cleaning" | "primary";
  onClick: () => void;
}

export function DateActionsPopover({
  date,
  status,
  dateBars,
  extendable,
  onClose,
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
  const [resNights, setResNights] = useState(1);
  const [resPlatform, setResPlatform] = useState<string>("airbnb");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Side panel doesn't dismiss on outside click — that would be too
    // aggressive when the rest of the page is fully interactive (the
    // user clicks another cell, the panel content updates rather than
    // disappearing). Escape still closes.
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", escHandler);
    return () => document.removeEventListener("keydown", escHandler);
  }, [onClose]);

  // Reset the create-reservation form whenever the date the panel is
  // showing changes. Otherwise the form state would leak across cells
  // (typed a name on one cell, switched cell, the name was still there).
  useEffect(() => {
    setCreating(false);
    setResName("");
    setResNights(1);
    setResPlatform("airbnb");
    setSubmitting(false);
  }, [date]);

  // Top-level status copy. When there are bars on this date the bar
  // list below the header carries the actual detail, so we keep the
  // header line short ("Booked" / "2 stays — turnover").
  const statusText = (() => {
    if (status.hasBar) {
      if (dateBars.length > 1) {
        return locale === "ru"
          ? `${dateBars.length} брони — пересменка`
          : `${dateBars.length} stays — turnover`;
      }
      return t("dateActions.statusBooked", { name: dateBars[0]?.name || "—" });
    }
    if (status.isOpenOverride) return t("dateActions.statusOpen");
    if (status.isManualCleaning) return locale === "ru" ? "Ручная уборка" : "Manual cleaning";
    if (status.isClosedOverride) return t("dateActions.statusClosed");
    if (status.isBuffer) return t("dateActions.statusCleaning");
    if (status.isSameDayCleaning) return t("dateActions.statusCleaning");
    if (status.isPotential) return t("dateActions.statusPotential");
    if (status.isUnbookable) return t("dateActions.statusUnbookable");
    return t("dateActions.statusFree");
  })();

  // Two bars are the SAME guest's stay (a manual reservation linked
  // to the iCal event it extends) iff one's eventUid matches the
  // other's linkedEventUid. A boundary between linked bars must NOT
  // surface a "cleaning required" row — there's no turnover.
  const isLinkedPair = (a: DateBarInfo, b: DateBarInfo) =>
    (!!a.eventUid && a.eventUid === b.linkedEventUid) ||
    (!!b.eventUid && b.eventUid === a.linkedEventUid);

  // True when the panel should slot a "Cleaning required" row
  // between two consecutive bars: a checkout followed (later in the
  // sorted list) by a checkin from a DIFFERENT guest.
  const cleaningBetweenIndex = (() => {
    for (let i = 0; i < dateBars.length - 1; i++) {
      const a = dateBars[i];
      const b = dateBars[i + 1];
      if (a.role === "checkout" && b.role === "checkin" && !isLinkedPair(a, b)) {
        return i; // insert AFTER index i
      }
    }
    return -1;
  })();

  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString(
    locale === "ru" ? "ru-RU" : "en-GB",
    { weekday: "long", day: "2-digit", month: "long", year: "numeric" }
  );

  // Derive the checkout date display from the chosen night count so
  // the host can see what's actually being booked before they save.
  const checkoutDateStr = (() => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + Math.max(1, resNights));
    return d.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    });
  })();

  // Build the action list per state.
  const actions: ResolvedAction[] = (() => {
    if (status.hasBar) {
      const turnoverNeedsCleaning = cleaningBetweenIndex >= 0 && !status.isManualCleaning;
      const lSchedule = locale === "ru" ? "Запланировать уборку" : "Schedule cleaning";
      const lScheduleDesc = locale === "ru"
        ? "Подтвердить уборку между бронированиями."
        : "Confirm a cleaning slot between the two stays.";
      const lRemoveCleaning = locale === "ru" ? "Снять уборку" : "Remove cleaning";
      const lRemoveCleaningDesc = locale === "ru"
        ? "Вернуть автоматическое определение."
        : "Go back to the auto-detected hint.";
      if (turnoverNeedsCleaning) {
        return [
          { kind: "scheduleCleaning", label: lSchedule, description: lScheduleDesc, tone: "cleaning", onClick: onScheduleCleaning },
        ];
      }
      if (status.isManualCleaning) {
        return [
          { kind: "removeCleaning", label: lRemoveCleaning, description: lRemoveCleaningDesc, tone: "open", onClick: onRemoveOverride },
        ];
      }
      return [];
    }

    const lBlock = locale === "ru" ? "Заблокировать дату" : "Block this date";
    const lBlockDesc = locale === "ru"
      ? "Запретить новые брони. Без отметки уборки."
      : "Stop new bookings. No cleaning chip.";
    const lSchedule = locale === "ru" ? "Запланировать уборку" : "Schedule cleaning";
    const lScheduleDesc = locale === "ru"
      ? "Заблокировать дату и пометить как уборку."
      : "Block the date and mark it as a cleaning slot.";
    const lOpen = locale === "ru" ? "Сделать доступной" : "Make available for booking";
    const lOpenDesc = locale === "ru"
      ? "Игнорировать буфер уборки / минимум ночей."
      : "Ignore buffer / min-nights for this date.";
    const lUnblock = locale === "ru" ? "Разблокировать" : "Unblock this date";
    const lRemoveCleaning = locale === "ru" ? "Снять уборку" : "Remove cleaning";
    const lRemoveOverride = locale === "ru" ? "Сбросить ручное состояние" : "Reset to default";
    const lRemoveOverrideDesc = locale === "ru"
      ? "Вернуть автоматическое поведение для этой даты."
      : "Return this date to its auto-detected state.";
    const lCreate = locale === "ru" ? "Создать бронь" : "Create reservation";
    const lCreateDesc = locale === "ru"
      ? "Добавить бронь, начинающуюся в этот день."
      : "Add a reservation starting on this date.";

    const createAction: ResolvedAction = {
      kind: "createReservation",
      label: lCreate,
      description: lCreateDesc,
      tone: "primary",
      onClick: () => setCreating(true),
    };

    // 1. Manual cleaning override → can lift it (back to default) or
    //    convert to a plain block.
    if (status.isManualCleaning) {
      return [
        createAction,
        { kind: "removeCleaning", label: lRemoveCleaning, description: lRemoveOverrideDesc, tone: "open", onClick: onRemoveOverride },
        { kind: "block", label: lBlock, description: lBlockDesc, tone: "block", onClick: onCloseDate },
      ];
    }
    // 2. Plain closed override → unblock + create.
    if (status.isClosedOverride) {
      return [
        createAction,
        { kind: "removeBlock", label: lUnblock, description: lRemoveOverrideDesc, tone: "open", onClick: onRemoveOverride },
      ];
    }
    // 3. Forced-open override.
    if (status.isOpenOverride) {
      return [
        createAction,
        { kind: "removeOverride", label: lRemoveOverride, description: lRemoveOverrideDesc, tone: "neutral", onClick: onRemoveOverride },
        { kind: "block", label: lBlock, description: lBlockDesc, tone: "block", onClick: onCloseDate },
        { kind: "scheduleCleaning", label: lSchedule, description: lScheduleDesc, tone: "cleaning", onClick: onScheduleCleaning },
      ];
    }
    // 4. Auto-detected unavailable.
    if (status.isBuffer || status.isSameDayCleaning || status.isUnbookable || status.isPotential) {
      return [
        createAction,
        { kind: "openForBooking", label: lOpen, description: lOpenDesc, tone: "open", onClick: onOpenDate },
      ];
    }
    // 5. Free date.
    return [
      createAction,
      { kind: "block", label: lBlock, description: lBlockDesc, tone: "block", onClick: onCloseDate },
      { kind: "scheduleCleaning", label: lSchedule, description: lScheduleDesc, tone: "cleaning", onClick: onScheduleCleaning },
    ];
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

  const statusBadgeClass = status.hasBar
    ? "bg-[var(--m-accent)]/10 text-[var(--m-accent)]"
    : status.isOpenOverride
      ? "bg-emerald-500/10 text-emerald-500"
      : status.isManualCleaning
        ? "bg-[var(--cleaning-bg)] text-[var(--cleaning-fg)]"
        : status.isClosedOverride
          ? "bg-rose-500/10 text-rose-500"
          : (status.isBuffer || status.isSameDayCleaning)
            ? "bg-[var(--cleaning-bg)] text-[var(--cleaning-fg)]"
            : status.isPotential
              ? "bg-[var(--ink)]/5 text-[var(--ink-2)]"
              : status.isUnbookable
                ? "bg-[var(--ink-4)]/10 text-[var(--ink-3)]"
                : "bg-emerald-500/10 text-emerald-500";

  const submitCreate = async () => {
    const finalName = resName.trim();
    if (!finalName) return;
    setSubmitting(true);
    try {
      onCreateReservation({ name: finalName, nights: Math.max(1, resNights), platform: resPlatform });
    } finally {
      setSubmitting(false);
    }
  };

  // Side panel — fixed to the right edge, full viewport height. The
  // .editorial class re-anchors the CSS-variable scope (the panel
  // portals to <body>, outside the dashboard's `.editorial` wrapper).
  // The slide-in animation comes from `.animate-slide-in-right` in
  // globals.css.
  return createPortal(
    <div
      ref={popRef}
      className="editorial fixed top-0 right-0 bottom-0 z-[100] flex w-full sm:w-[400px] flex-col border-l border-[var(--line-2)] bg-[var(--bg)] shadow-2xl shadow-black/30 animate-slide-in-right"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wide text-[var(--ink-4)]">{t("dateActions.title")}</div>
          <div className="mt-0.5 text-base font-semibold text-[var(--ink)]">{formattedDate}</div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-[var(--ink-4)]">{t("dateActions.status")}:</span>
            <span className={`rounded px-1.5 py-0.5 font-medium ${statusBadgeClass}`}>
              {statusText}
            </span>
          </div>
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

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
        {/* Day timeline */}
        {dateBars.length > 0 && (
          <div className="border-b border-[var(--line)] px-4 py-3 space-y-2">
            {dateBars.map((b, i) => {
              const platformColor = b.platform === "booking" ? "#003580" : "#ff385c";
              const platformLabel = b.platform === "booking" ? "Booking" : b.platform === "airbnb" ? "Airbnb" : b.platform;
              const roleLabel = (() => {
                if (b.role === "checkout") return locale === "ru" ? "выезжает" : "checking out";
                if (b.role === "checkin") return locale === "ru" ? "заезжает" : "checking in";
                if (b.role === "fullday") return locale === "ru" ? "однодневная бронь" : "single-day stay";
                return locale === "ru" ? "проживает" : "staying";
              })();
              return (
                <div key={`bar-${i}`}>
                  <div className="flex items-center gap-2">
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white"
                      style={{ backgroundColor: platformColor }}
                    >
                      {platformLabel}
                    </span>
                    <span className="flex-1 min-w-0 truncate text-sm font-medium text-[var(--ink)]">{b.name}</span>
                  </div>
                  <div className="ml-[58px] mt-0.5 text-[11px] text-[var(--ink-3)]">{roleLabel}</div>
                  {i === cleaningBetweenIndex && (
                    <div className="my-2 flex items-center gap-2 rounded-md border border-[var(--cleaning-border)] bg-[var(--cleaning-bg)] px-2.5 py-1.5">
                      <svg className="h-4 w-4 text-[var(--cleaning-fg)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium text-[var(--cleaning-fg)]">
                        {status.isManualCleaning
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

        {/* Inline create-reservation form: replaces the action list
            when the user clicks "Create reservation". Submitting calls
            onCreateReservation and the parent closes the panel. */}
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

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)] mb-1.5">
                {locale === "ru" ? "Ночей" : "Nights"}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setResNights((n) => Math.max(1, n - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] text-[var(--ink)] hover:bg-[var(--bg-3)]"
                  aria-label="Decrease nights"
                >–</button>
                <span className="text-base font-semibold text-[var(--ink)] tabular-nums w-6 text-center">{resNights}</span>
                <button
                  type="button"
                  onClick={() => setResNights((n) => n + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] text-[var(--ink)] hover:bg-[var(--bg-3)]"
                  aria-label="Increase nights"
                >+</button>
                <span className="text-xs text-[var(--ink-3)]">
                  {locale === "ru" ? "Выезд:" : "Check-out:"} <span className="text-[var(--ink-2)] font-medium">{checkoutDateStr}</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Actions list (default state) */
          <div className="px-2.5 py-2.5">
            {status.hasBar ? (
              actions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[var(--ink-4)]">{t("dateActions.cantModifyBooked")}</div>
              ) : (
                actions.map((a) => (
                  <button
                    key={a.kind}
                    onClick={a.onClick}
                    className={`w-full flex items-start gap-2.5 rounded-md px-3 py-2.5 text-left transition-colors text-[var(--ink)] ${toneClass(a.tone)}`}
                  >
                    <span className="mt-0.5 shrink-0">{iconFor(a.kind)}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium">{a.label}</span>
                      {a.description && (
                        <span className="block text-[11px] text-[var(--ink-4)] mt-0.5 leading-snug">{a.description}</span>
                      )}
                    </span>
                  </button>
                ))
              )
            ) : actions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[var(--ink-4)]">
                {locale === "ru" ? "Нет доступных действий." : "No actions available."}
              </div>
            ) : (
              actions.map((a) => (
                <button
                  key={a.kind}
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
            )}

            {/* Extend booking section */}
            {!status.hasBar && extendable.length > 0 && (
              <div className="mt-2 border-t border-[var(--line)] pt-2">
                <div className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-[var(--ink-4)]">
                  {t("dateActions.extendDesc")}
                </div>
                {extendable.map((b, i) => (
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
                    <span className="text-[10px] text-[var(--ink-4)]">
                      {b.side === "before" ? "→" : "←"}
                    </span>
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
            {submitting
              ? (locale === "ru" ? "Сохраняю…" : "Saving…")
              : (locale === "ru" ? "Сохранить" : "Save")}
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
