"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n/context";

export interface DateStatus {
  hasBar: boolean;
  barName?: string;
  barPlatform?: string;
  isBuffer: boolean;
  isPotential: boolean;
  isSameDayCleaning: boolean;
  isUnbookable: boolean;
  isOpenOverride: boolean;
  isClosedOverride: boolean;
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
  extendable: ExtendableBooking[];
  onClose: () => void;
  onCloseDate: () => void;
  onOpenDate: () => void;
  onAddCleaning: () => void;
  onRemoveCleaning: () => void;
  onRemoveOverride: () => void;
  onExtendBooking: (booking: ExtendableBooking) => void;
}

export function DateActionsPopover({
  date,
  anchorRect,
  status,
  extendable,
  onClose,
  onCloseDate,
  onOpenDate,
  onAddCleaning,
  onRemoveCleaning,
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

  const statusText = (() => {
    if (status.hasBar) return t("dateActions.statusBooked", { name: status.barName || "—" });
    if (status.isOpenOverride) return t("dateActions.statusOpen");
    if (status.isClosedOverride) return t("dateActions.statusClosed");
    if (status.isBuffer) return t("dateActions.statusCleaning");
    if (status.isSameDayCleaning) return t("dateActions.statusCleaning");
    if (status.isPotential) return t("dateActions.statusPotential");
    if (status.isUnbookable) return t("dateActions.statusUnbookable");
    return t("dateActions.statusFree");
  })();

  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString(
    locale === "ru" ? "ru-RU" : "en-GB",
    { weekday: "long", day: "2-digit", month: "long", year: "numeric" }
  );

  // Determine which actions are available
  const canClose = !status.hasBar && !status.isClosedOverride;
  const canOpen = !status.hasBar && (status.isClosedOverride || status.isBuffer || status.isPotential || status.isSameDayCleaning || status.isUnbookable) && !status.isOpenOverride;
  const canAddCleaning = !status.hasBar && !status.isClosedOverride && !status.isBuffer;
  const canRemoveCleaning = !status.hasBar && (status.isBuffer || status.isSameDayCleaning) && !status.isOpenOverride;
  const canRemoveOverride = (status.isOpenOverride || status.isClosedOverride) && !status.hasBar;

  const actionBtn = "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors";

  return createPortal(
    <div
      ref={popRef}
      className="fixed z-[100] w-[280px] rounded-xl border border-[#27272b] bg-[#18181b] shadow-2xl shadow-black/60"
      style={{ top, left }}
    >
      {/* Header */}
      <div className="border-b border-[#27272b] px-4 py-3">
        <div className="text-xs uppercase tracking-wide text-[#71717a]">{t("dateActions.title")}</div>
        <div className="mt-0.5 text-sm font-medium text-[#e8e8ec]">{formattedDate}</div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="text-[#71717a]">{t("dateActions.status")}:</span>
          <span className={`rounded px-1.5 py-0.5 font-medium ${
            status.hasBar ? "bg-[#ff385c]/10 text-[#ff385c]"
            : status.isOpenOverride ? "bg-[#34d399]/10 text-[#34d399]"
            : status.isClosedOverride ? "bg-[#ef4444]/10 text-[#ef4444]"
            : (status.isBuffer || status.isSameDayCleaning) ? "bg-[#fbbf24]/10 text-[#fbbf24]"
            : status.isPotential ? "bg-[#93c5fd]/10 text-[#93c5fd]"
            : status.isUnbookable ? "bg-[#71717a]/10 text-[#a0a0a8]"
            : "bg-[#34d399]/10 text-[#34d399]"
          }`}>
            {statusText}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-1.5">
        {status.hasBar ? (
          <div className="px-3 py-2 text-xs text-[#71717a]">{t("dateActions.cantModifyBooked")}</div>
        ) : (
          <>
            {canClose && (
              <button onClick={onCloseDate} className={`${actionBtn} text-[#e0e0e4] hover:bg-[#ef4444]/10 hover:text-[#ef4444]`}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                {t("dateActions.close")}
              </button>
            )}
            {canOpen && (
              <button onClick={onOpenDate} className={`${actionBtn} text-[#e0e0e4] hover:bg-[#34d399]/10 hover:text-[#34d399]`}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                {t("dateActions.open")}
              </button>
            )}
            {canAddCleaning && (
              <button onClick={onAddCleaning} className={`${actionBtn} text-[#e0e0e4] hover:bg-[#fbbf24]/10 hover:text-[#fbbf24]`}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 2.25L12 6m0 0l-3.75-3.75M12 6v12m6 0H6" />
                </svg>
                {t("dateActions.addCleaning")}
              </button>
            )}
            {canRemoveCleaning && (
              <button onClick={onRemoveCleaning} className={`${actionBtn} text-[#e0e0e4] hover:bg-[#ef4444]/10 hover:text-[#ef4444]`}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
                {t("dateActions.removeCleaning")}
              </button>
            )}
            {canRemoveOverride && (
              <button onClick={onRemoveOverride} className={`${actionBtn} text-[#e0e0e4] hover:bg-[#1e1e22]`}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                {t("dateActions.removeOverride")}
              </button>
            )}
          </>
        )}

        {/* Extend booking section */}
        {!status.hasBar && extendable.length > 0 && (
          <div className="mt-1 border-t border-[#27272b] pt-1.5">
            <div className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-[#71717a]">
              {t("dateActions.extendDesc")}
            </div>
            {extendable.map((b, i) => (
              <button
                key={i}
                onClick={() => onExtendBooking(b)}
                className={`${actionBtn} text-[#e0e0e4] hover:bg-[#1e1e22] group`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded"
                  style={{
                    backgroundColor: b.platform === "booking" ? "#003580" : "#ff385c",
                    backgroundImage: "repeating-linear-gradient(-45deg, transparent 0 3px, rgba(255,255,255,0.25) 3px 4px)",
                  }}
                />
                <span className="flex-1 truncate">{b.name}</span>
                <span className="text-[10px] text-[#71717a]">
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
