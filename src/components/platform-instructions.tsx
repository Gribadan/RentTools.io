"use client";

import Image from "next/image";
import { useState } from "react";

type Platform = "airbnb" | "booking";
type Mode = "export" | "import";

interface PlatformInstructionsProps {
  platform: Platform;
  mode: Mode;
  defaultOpen?: boolean;
}

interface InstructionData {
  title: string;
  gif: string;
  steps: string[];
}

const DATA: Record<Platform, Record<Mode, InstructionData>> = {
  airbnb: {
    export: {
      title: "How to find the Airbnb iCal export URL",
      gif: "/onboard/airbnb-export.gif",
      steps: [
        "Open airbnb.com and go to your listing.",
        "Click \"Calendar\" in the top menu.",
        "Click the gear icon (Availability settings) on the right.",
        "Scroll to the \"Sync calendars\" section.",
        "Click \"Export Calendar\".",
        "Copy the URL (it starts with https://www.airbnb.com/calendar/ical/…).",
      ],
    },
    import: {
      title: "How to import RentTools into Airbnb",
      gif: "/onboard/airbnb-import.gif",
      steps: [
        "Back in Airbnb → Calendar → Availability settings.",
        "Find the \"Sync calendars\" section.",
        "If Booking.com is already linked there, remove it — replace with our URL.",
        "Click \"Import calendar\".",
        "Paste the URL above into the \"Calendar address (URL)\" field.",
        "Name it \"RentTools Sync\" and click Import.",
      ],
    },
  },
  booking: {
    export: {
      title: "How to find the Booking.com iCal export URL",
      gif: "/onboard/booking-export.gif",
      steps: [
        "Open admin.booking.com (Booking.com Extranet).",
        "Open Rates & Availability in the left menu.",
        "Click \"Sync calendars\" (sometimes \"Calendar Sync\").",
        "Find the \"Export\" section.",
        "Click \"Copy Link\" next to your iCal export URL.",
        "The URL looks like https://admin.booking.com/hotel/hoteladmin/ical.html?…",
      ],
    },
    import: {
      title: "How to import RentTools into Booking.com",
      gif: "/onboard/booking-import.gif",
      steps: [
        "Back in admin.booking.com → Rates & Availability → Sync calendars.",
        "If Airbnb is already linked there, remove it — replace with our URL.",
        "Find the \"Import\" section (or \"Add connection\").",
        "Paste the URL above into the iCal URL field.",
        "Name it \"RentTools Sync\" and click Save.",
      ],
    },
  },
};

export function PlatformInstructions({ platform, mode, defaultOpen = false }: PlatformInstructionsProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [imgError, setImgError] = useState(false);
  const data = DATA[platform][mode];

  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--bg)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink)]"
      >
        <span>{data.title}</span>
        <svg
          className={`h-3.5 w-3.5 text-[var(--ink-4)] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-[var(--line)] p-3 space-y-3">
          {!imgError ? (
            <Image
              src={data.gif}
              alt={data.title}
              width={1280}
              height={720}
              unoptimized
              onError={() => setImgError(true)}
              className="h-auto w-full rounded-md border border-[var(--line)]"
            />
          ) : (
            <div className="flex items-center justify-center rounded-md border border-dashed border-[var(--line)] bg-[var(--bg)] py-6 text-center text-[11px] text-[var(--ink-4)]">
              Tutorial GIF coming soon — follow the steps below.
            </div>
          )}
          <ol className="space-y-1.5 text-[12px] text-[var(--ink-3)]">
            {data.steps.map((line, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-px shrink-0 rounded bg-[var(--bg-3)] px-1.5 text-center font-mono text-[10px] text-[var(--ink-3)]">
                  {i + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
