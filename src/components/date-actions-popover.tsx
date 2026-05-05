"use client";

import { useEffect, useRef } from "react";
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

interface DateActionsPopoverProps {
  date: string;
  anchorRect: DOMRect;
  status: DateStatus;
  /** All bars touching this date, sorted by role (checkout → midstay
   *  → checkin). The popover renders them in that order so a same-day
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
}

// Resolved per-state action set. We compute one of these from the
// DateStatus so the UI doesn't have to chain a thicket of `canX` flags
// at render-time and present overlapping or contradictory buttons (the
// bug the user reported: a date that was just blocked offering both
// "Open date", "Remove cleaning" — which was never set — and "Remove
// override", which was the same effect as Open date).
type ActionKind = "block" | "scheduleCleaning" | "openForBooking" | "removeOverride" | "removeBlock" | "removeCleaning";

interface ResolvedAction {
  kind: ActionKind;
  label: string;
  description?: string;
  tone: "neutral" | "block" | "open" | "cleaning";
  onClick: () => void;
}

export function DateActionsPopover({
  date,
  anchorRect,
  status,
  dateBars,
  extendable,
  onClose,
  onCloseDate,
  onOpenDate,
  onScheduleCleaning,
  onRemoveOverride,
  onExtendBooking,
}: DateActionsPopoverProps) {
  const { t, locale } = useI18n();
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) onClose();
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [onClose]);

  // Position popover near the clicked cell
  const popWidth = 280;
  const margin = 8;
  let left = anchorRect.left;
  if (left + popWidth + margin > window.innerWidth) {
    left = window.innerWidth - popWidth - margin;
  }
  if (left < margin) left = margin;
  let top = anchorRect.bottom + 6;
  if (top + 360 > window.innerHeight && anchorRect.top - 6 - 360 > 0) {
    top = anchorRect.top - 6 - 360;
  }

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

  // True when the popover should slot a "Cleaning required" row
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

  // Build the action list per state. Each branch is exclusive — the user
  // sees ONE coherent set of options, never duplicates of the same effect
  // labelled differently. Order is most-likely-action first.
  const actions: ResolvedAction[] = (() => {
    // Booked dates — no actions in the general case, but a same-day
    // turnover between DIFFERENT guests is the one place where the
    // host might want to confirm a manual cleaning slot (per user
    // request: "manually I need to be able to insert cleaning"). So
    // we surface a single Schedule-cleaning action there. The cleaning
    // override coexists with the bookings — useCalendarData picks it
    // up via cleaningOverrides.
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

    // 1. Manual cleaning override → can lift it (back to default) or
    //    convert to a plain block.
    if (status.isManualCleaning) {
      return [
        { kind: "removeCleaning", label: lRemoveCleaning, description: lRemoveOverrideDesc, tone: "open", onClick: onRemoveOverride },
        { kind: "block", label: lBlock, description: lBlockDesc, tone: "block", onClick: onCloseDate },
      ];
    }

    // 2. Plain closed override → only "unblock". The previous build
    //    surfaced "Remove cleaning" + "Remove override" + "Open date"
    //    here, but cleaning was never applied and the latter two are
    //    the same thing, hence the user's confusion.
    if (status.isClosedOverride) {
      return [
        { kind: "removeBlock", label: lUnblock, description: lRemoveOverrideDesc, tone: "open", onClick: onRemoveOverride },
      ];
    }

    // 3. Forced-open override → revert to default OR block.
    if (status.isOpenOverride) {
      return [
        { kind: "removeOverride", label: lRemoveOverride, description: lRemoveOverrideDesc, tone: "neutral", onClick: onRemoveOverride },
        { kind: "block", label: lBlock, description: lBlockDesc, tone: "block", onClick: onCloseDate },
        { kind: "scheduleCleaning", label: lSchedule, description: lScheduleDesc, tone: "cleaning", onClick: onScheduleCleaning },
      ];
    }

    // 4. Auto-detected unavailable (buffer / same-day-cleaning / unbookable / potential)
    //    → only meaningful action is "make this available anyway".
    if (status.isBuffer || status.isSameDayCleaning || status.isUnbookable || status.isPotential) {
      return [
        { kind: "openForBooking", label: lOpen, description: lOpenDesc, tone: "open", onClick: onOpenDate },
      ];
    }

    // 5. Free date → block or schedule a cleaning.
    return [
      { kind: "block", label: lBlock, description: lBlockDesc, tone: "block", onClick: onCloseDate },
      { kind: "scheduleCleaning", label: lSchedule, description: lScheduleDesc, tone: "cleaning", onClick: onScheduleCleaning },
    ];
  })();

  const toneClass = (tone: ResolvedAction["tone"]) => {
    switch (tone) {
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
      case "block":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        );
      case "scheduleCleaning":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
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

  // Status badge colour map kept in sync with the cell rendering so the
  // popover header reads the same as what the user clicked on.
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

  // The popover lives at <body> via a portal, OUTSIDE the dashboard's
  // `.editorial` wrapper, so we add the class here to anchor the CSS
  // variable scope (otherwise --bg / --ink / --line all resolve to
  // nothing and the popover paints transparent).
  return createPortal(
    <div
      ref={popRef}
      className="editorial fixed z-[100] w-[280px] rounded-xl border border-[var(--line-2)] bg-[var(--bg)] shadow-2xl shadow-black/30"
      style={{ top, left }}
    >
      {/* Header */}
      <div className="border-b border-[var(--line)] px-4 py-3">
        <div className="text-xs uppercase tracking-wide text-[var(--ink-4)]">{t("dateActions.title")}</div>
        <div className="mt-0.5 text-sm font-medium text-[var(--ink)]">{formattedDate}</div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="text-[var(--ink-4)]">{t("dateActions.status")}:</span>
          <span className={`rounded px-1.5 py-0.5 font-medium ${statusBadgeClass}`}>
            {statusText}
          </span>
        </div>
      </div>

      {/* Day timeline — when one or more reservations touch this date,
          render them in temporal order (checkout → midstay → checkin)
          with a "Cleaning required" row inserted between a back-to-back
          checkout and checkin so a same-day turnover is fully visible
          instead of only the first matching bar. */}
      {dateBars.length > 0 && (
        <div className="border-b border-[var(--line)] px-3 py-2 space-y-1.5">
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
                {/* Slot a cleaning indicator AFTER a checkout that's
                    immediately followed by a checkin (same-day
                    turnover). */}
                {i === cleaningBetweenIndex && (
                  <div className="my-1.5 flex items-center gap-2 rounded-md border border-[var(--cleaning-border)] bg-[var(--cleaning-bg)] px-2.5 py-1.5">
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

      {/* Actions */}
      <div className="p-1.5">
        {status.hasBar ? (
          <div className="px-3 py-2 text-xs text-[var(--ink-4)]">{t("dateActions.cantModifyBooked")}</div>
        ) : actions.length === 0 ? (
          <div className="px-3 py-2 text-xs text-[var(--ink-4)]">
            {locale === "ru" ? "Нет доступных действий." : "No actions available."}
          </div>
        ) : (
          actions.map((a) => (
            <button
              key={a.kind}
              onClick={a.onClick}
              className={`w-full flex items-start gap-2.5 rounded-md px-3 py-2 text-left transition-colors text-[var(--ink)] ${toneClass(a.tone)}`}
            >
              <span className="mt-0.5 shrink-0">{iconFor(a.kind)}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm">{a.label}</span>
                {a.description && (
                  <span className="block text-[11px] text-[var(--ink-4)] mt-0.5 leading-snug">{a.description}</span>
                )}
              </span>
            </button>
          ))
        )}

        {/* Extend booking section */}
        {!status.hasBar && extendable.length > 0 && (
          <div className="mt-1 border-t border-[var(--line)] pt-1.5">
            <div className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-[var(--ink-4)]">
              {t("dateActions.extendDesc")}
            </div>
            {extendable.map((b, i) => (
              <button
                key={i}
                onClick={() => onExtendBooking(b)}
                className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left text-[var(--ink)] hover:bg-[var(--bg-3)] group"
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
    </div>,
    document.body
  );
}
