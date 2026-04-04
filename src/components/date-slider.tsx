"use client";

import { useState, useMemo, useRef, useEffect } from "react";

interface DateSliderProps {
  checkIn: string;
  checkOut: string;
  onChangeCheckIn: (date: string) => void;
  onChangeCheckOut: (date: string) => void;
  compact?: boolean;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDay(d: Date): { day: string; weekday: string; month: string; isToday: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compare = new Date(d);
  compare.setHours(0, 0, 0, 0);
  return {
    day: String(d.getDate()),
    weekday: d.toLocaleDateString("en", { weekday: "short" }).slice(0, 2),
    month: d.toLocaleDateString("en", { month: "short" }),
    isToday: compare.getTime() === today.getTime(),
  };
}

export function DateSlider({
  checkIn,
  checkOut,
  onChangeCheckIn,
  onChangeCheckOut,
  compact = false,
}: DateSliderProps) {
  const [showClassic, setShowClassic] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate days: 3 days back to 30 days forward
  const days = useMemo(() => {
    const result: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = -3; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      result.push(d);
    }
    return result;
  }, []);

  // Selection state
  const [selecting, setSelecting] = useState<"in" | "out" | null>(
    !checkIn ? "in" : !checkOut ? "out" : null
  );

  // Auto-scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      const todayEl = scrollRef.current.querySelector("[data-today]");
      if (todayEl) {
        todayEl.scrollIntoView({ inline: "center", block: "nearest" });
      }
    }
  }, []);

  const handleDayClick = (dateStr: string) => {
    if (selecting === "in" || (!selecting && !checkIn)) {
      onChangeCheckIn(dateStr);
      setSelecting("out");
    } else if (selecting === "out" || (!selecting && !checkOut)) {
      // Ensure checkOut >= checkIn
      if (checkIn && dateStr < checkIn) {
        onChangeCheckIn(dateStr);
        onChangeCheckOut(checkIn);
      } else {
        onChangeCheckOut(dateStr);
      }
      setSelecting(null);
    } else {
      // Both set, start over
      onChangeCheckIn(dateStr);
      onChangeCheckOut("");
      setSelecting("out");
    }
  };

  const isInRange = (dateStr: string) => {
    if (!checkIn || !checkOut) return false;
    return dateStr >= checkIn && dateStr <= checkOut;
  };

  const dayCount = () => {
    if (!checkIn || !checkOut) return 0;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  if (showClassic) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-8 text-[11px] text-[#484f58]">In</span>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => onChangeCheckIn(e.target.value)}
            className="h-7 flex-1 rounded border border-[#30363d] bg-[#0d1117] px-2 text-xs text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-8 text-[11px] text-[#484f58]">Out</span>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => onChangeCheckOut(e.target.value)}
            className="h-7 flex-1 rounded border border-[#30363d] bg-[#0d1117] px-2 text-xs text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowClassic(false)}
          className="text-[10px] text-[#58a6ff] hover:underline"
        >
          Use slider
        </button>
      </div>
    );
  }

  // Track which months appear
  let lastMonth = "";

  return (
    <div className="space-y-1.5">
      {/* Hint */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#484f58]">
          {selecting === "in"
            ? "Select check-in"
            : selecting === "out"
            ? "Select check-out"
            : checkIn && checkOut
            ? `${dayCount()} days`
            : "Tap a date"}
        </span>
        <button
          type="button"
          onClick={() => setShowClassic(true)}
          className="text-[10px] text-[#58a6ff] hover:underline"
        >
          Manual
        </button>
      </div>

      {/* Scrollable day strip */}
      <div
        ref={scrollRef}
        className="flex gap-0.5 overflow-x-auto pb-1 scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {days.map((d) => {
          const dateStr = toDateStr(d);
          const info = formatDay(d);
          const isStart = dateStr === checkIn;
          const isEnd = dateStr === checkOut;
          const inRange = isInRange(dateStr);

          // Month separator
          const monthLabel = info.month;
          let showMonth = false;
          if (monthLabel !== lastMonth) {
            showMonth = true;
            lastMonth = monthLabel;
          }

          return (
            <div key={dateStr} className="flex flex-col items-center">
              {showMonth && (
                <span className="mb-0.5 text-[8px] font-medium text-[#8b949e]">
                  {monthLabel}
                </span>
              )}
              {!showMonth && <span className="mb-0.5 text-[8px] invisible">X</span>}
              <button
                type="button"
                onClick={() => handleDayClick(dateStr)}
                data-today={info.isToday ? "" : undefined}
                className={`flex flex-col items-center rounded-md transition-all ${
                  compact ? "w-7 py-1" : "w-8 py-1.5"
                } ${
                  isStart || isEnd
                    ? "bg-[#58a6ff] text-white"
                    : inRange
                    ? "bg-[#58a6ff]/15 text-[#79c0ff]"
                    : info.isToday
                    ? "bg-[#1c2128] text-[#f0f6fc] ring-1 ring-[#58a6ff]/40"
                    : "text-[#8b949e] hover:bg-[#1c2128] hover:text-[#c9d1d9]"
                }`}
              >
                <span className="text-[8px] leading-none">{info.weekday}</span>
                <span className={`font-medium leading-none mt-0.5 ${compact ? "text-[11px]" : "text-xs"}`}>
                  {info.day}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
