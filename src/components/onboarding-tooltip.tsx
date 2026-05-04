"use client";

import { useEffect, useState, type ReactNode } from "react";

interface OnboardingTooltipProps {
  id: string;
  text: string;
  children: ReactNode;
  position?: "below" | "above";
}

export function OnboardingTooltip({ id, text, children, position = "below" }: OnboardingTooltipProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(`tooltip:${id}`) === "1";
    setShow(!seen);
  }, [id]);

  const dismiss = () => {
    try {
      localStorage.setItem(`tooltip:${id}`, "1");
    } catch {}
    setShow(false);
  };

  return (
    <div className="relative inline-flex w-fit max-w-full">
      {children}
      {show && (
        <div
          className={`absolute left-0 z-30 w-64 rounded-md border border-[#ff385c]/40 bg-[#1e1e22] px-3 py-2 text-xs text-[#e8e8ec] shadow-lg ${
            position === "above" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          role="tooltip"
        >
          <p className="pr-4">{text}</p>
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-1 top-1 rounded p-0.5 text-[#a0a0a8] hover:bg-[#27272b] hover:text-[#e8e8ec]"
            aria-label="Dismiss"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span
            className={`absolute left-4 h-2 w-2 rotate-45 border-[#ff385c]/40 bg-[#1e1e22] ${
              position === "above"
                ? "-bottom-1 border-b border-r"
                : "-top-1 border-l border-t"
            }`}
          />
        </div>
      )}
    </div>
  );
}
