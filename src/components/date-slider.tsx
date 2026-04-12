"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface DateSliderProps {
  checkIn: string;
  checkOut: string;
  onChangeCheckIn: (date: string) => void;
  onChangeCheckOut: (date: string) => void;
  compact?: boolean;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function CalendarGrid({
  checkIn,
  checkOut,
  onChangeCheckIn,
  onChangeCheckOut,
  onDone,
}: {
  checkIn: string;
  checkOut: string;
  onChangeCheckIn: (date: string) => void;
  onChangeCheckOut: (date: string) => void;
  onDone?: () => void;
}) {
  const [selecting, setSelecting] = useState<"in" | "out">(
    !checkIn ? "in" : !checkOut ? "out" : "in"
  );
  const [showClassic, setShowClassic] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Build months to display (current month and next month)
  const months = useMemo(() => {
    const m1 = new Date(today.getFullYear(), today.getMonth(), 1);
    const m2 = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return [m1, m2];
  }, [today]);

  const handleDayClick = (dateStr: string) => {
    if (selecting === "in") {
      onChangeCheckIn(dateStr);
      onChangeCheckOut("");
      setSelecting("out");
    } else {
      if (checkIn && dateStr < checkIn) {
        onChangeCheckIn(dateStr);
        onChangeCheckOut(checkIn);
      } else {
        onChangeCheckOut(dateStr);
      }
      setSelecting("in");
    }
  };

  const isInRange = (dateStr: string) => {
    if (!checkIn || !checkOut) return false;
    return dateStr > checkIn && dateStr < checkOut;
  };

  const dayCount = () => {
    if (!checkIn || !checkOut) return 0;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatSelected = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  if (showClassic) {
    return (
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2">
          <span className="w-10 text-xs text-[#a0a0a8]">In</span>
          <input type="date" value={checkIn} onChange={(e) => onChangeCheckIn(e.target.value)}
            className="h-8 flex-1 rounded-md border border-[#333338] bg-[#111113] px-3 text-sm text-[#e8e8ec] outline-none focus:border-[#e8e8ec]" />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-10 text-xs text-[#a0a0a8]">Out</span>
          <input type="date" value={checkOut} onChange={(e) => onChangeCheckOut(e.target.value)}
            className="h-8 flex-1 rounded-md border border-[#333338] bg-[#111113] px-3 text-sm text-[#e8e8ec] outline-none focus:border-[#e8e8ec]" />
        </div>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setShowClassic(false)} className="text-xs text-[#e8e8ec] hover:underline">
            Calendar
          </button>
          {onDone && checkIn && checkOut && (
            <button type="button" onClick={onDone} className="rounded-md bg-[#ff385c] px-3 py-1 text-xs font-medium text-white hover:bg-[#e0294d]">
              Done
            </button>
          )}
        </div>
      </div>
    );
  }

  const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div className="p-3">
      {/* Status bar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelecting("in")}
            className={`rounded-md px-2.5 py-1 text-xs transition-all ${
              selecting === "in"
                ? "bg-[#e8e8ec]/15 text-[#e8e8ec] ring-1 ring-[#e8e8ec]/30"
                : "text-[#a0a0a8] hover:text-[#d4d4d8]"
            }`}
          >
            In: {formatSelected(checkIn)}
          </button>
          <span className="text-[#333338]">→</span>
          <button
            type="button"
            onClick={() => setSelecting("out")}
            className={`rounded-md px-2.5 py-1 text-xs transition-all ${
              selecting === "out"
                ? "bg-[#e8e8ec]/15 text-[#e8e8ec] ring-1 ring-[#e8e8ec]/30"
                : "text-[#a0a0a8] hover:text-[#d4d4d8]"
            }`}
          >
            Out: {formatSelected(checkOut)}
          </button>
          {checkIn && checkOut && (
            <span className="text-xs text-[#34d399]">{dayCount()} days</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowClassic(true)} className="text-xs text-[#e8e8ec] hover:underline">
            Manual
          </button>
          {onDone && checkIn && checkOut && (
            <button type="button" onClick={onDone} className="rounded-md bg-[#ff385c] px-3 py-1 text-xs font-medium text-white hover:bg-[#e0294d]">
              Done
            </button>
          )}
        </div>
      </div>

      {/* Calendar grids */}
      <div className="flex gap-4">
        {months.map((monthStart) => {
          const year = monthStart.getFullYear();
          const month = monthStart.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();

          // Monday = 0 offset
          let firstDayOffset = new Date(year, month, 1).getDay() - 1;
          if (firstDayOffset < 0) firstDayOffset = 6;

          const cells: (Date | null)[] = [];
          for (let i = 0; i < firstDayOffset; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

          const monthLabel = monthStart.toLocaleDateString("en", { month: "long", year: "numeric" });

          return (
            <div key={monthLabel} className="flex-1">
              <div className="mb-2 text-center text-xs font-medium text-[#e8e8ec]">
                {monthLabel}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {WEEKDAYS.map((wd) => (
                  <div key={wd} className="py-1 text-center text-xs text-[#71717a]">
                    {wd}
                  </div>
                ))}
                {cells.map((d, i) => {
                  if (!d) return <div key={`empty-${i}`} />;

                  const dateStr = toDateStr(d);
                  const isToday = d.getTime() === today.getTime();
                  const isStart = dateStr === checkIn;
                  const isEnd = dateStr === checkOut;
                  const inRange = isInRange(dateStr);

                  // Dim dates more than 3 days in the past
                  const threeDaysAgo = new Date(today);
                  threeDaysAgo.setDate(threeDaysAgo.getDate() - 4);
                  const isPast = d < threeDaysAgo;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleDayClick(dateStr)}
                      className={`relative flex h-8 items-center justify-center rounded-md text-xs transition-all ${
                        isPast
                          ? "text-[#333338] cursor-not-allowed"
                          : isStart || isEnd
                          ? "bg-[#e8e8ec] text-white font-semibold"
                          : inRange
                          ? "bg-[#e8e8ec]/12 text-[#93c5fd]"
                          : isToday
                          ? "text-[#e8e8ec] ring-1 ring-[#e8e8ec]/40"
                          : "text-[#d4d4d8] hover:bg-[#1e1e22]"
                      }`}
                    >
                      {d.getDate()}
                      {isToday && !isStart && !isEnd && (
                        <span className="absolute bottom-0.5 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-[#e8e8ec]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Popover version — renders a portal floating next to the trigger
function CalendarPopover({
  anchorRef,
  checkIn,
  checkOut,
  onChangeCheckIn,
  onChangeCheckOut,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  checkIn: string;
  checkOut: string;
  onChangeCheckIn: (date: string) => void;
  onChangeCheckOut: (date: string) => void;
  onClose: () => void;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: Math.max(8, rect.top - 40),
        left: rect.right + 8,
      });
    }
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-50 rounded-lg border border-[#333338] bg-[#18181b] shadow-2xl shadow-black/50"
      style={{ top: pos.top, left: pos.left, width: 480 }}
    >
      <CalendarGrid
        checkIn={checkIn}
        checkOut={checkOut}
        onChangeCheckIn={onChangeCheckIn}
        onChangeCheckOut={onChangeCheckOut}
        onDone={onClose}
      />
    </div>,
    document.body
  );
}

export function DateSlider({
  checkIn,
  checkOut,
  onChangeCheckIn,
  onChangeCheckOut,
  compact = false,
}: DateSliderProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const formatDate = (d: string) => {
    if (!d) return "Select";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const dayCount = useCallback(() => {
    if (!checkIn || !checkOut) return 0;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [checkIn, checkOut]);

  if (compact) {
    // Sidebar mode — show compact trigger button, open popover
    return (
      <>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(!open)}
          className={`flex w-full items-center justify-between rounded-md border px-2.5 py-2 text-left transition-all ${
            open
              ? "border-[#e8e8ec] bg-[#e8e8ec]/5"
              : "border-[#333338] bg-[#111113] hover:border-[#71717a]"
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="h-3.5 w-3.5 text-[#a0a0a8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span className="text-xs text-[#d4d4d8]">
              {checkIn && checkOut
                ? `${formatDate(checkIn)} — ${formatDate(checkOut)}`
                : checkIn
                ? `${formatDate(checkIn)} — ...`
                : "Select dates"}
            </span>
          </div>
          {checkIn && checkOut && (
            <span className="text-xs text-[#34d399]">{dayCount()}d</span>
          )}
        </button>
        {open && (
          <CalendarPopover
            anchorRef={triggerRef}
            checkIn={checkIn}
            checkOut={checkOut}
            onChangeCheckIn={onChangeCheckIn}
            onChangeCheckOut={onChangeCheckOut}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  }

  // Inline mode for edit forms in main content
  return (
    <div className="rounded-lg border border-[#333338] bg-[#18181b]">
      <CalendarGrid
        checkIn={checkIn}
        checkOut={checkOut}
        onChangeCheckIn={onChangeCheckIn}
        onChangeCheckOut={onChangeCheckOut}
      />
    </div>
  );
}
