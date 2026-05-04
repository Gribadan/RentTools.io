"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

interface Shortcut {
  keys: string[];
  description: { en: string; ru: string };
}

const SHORTCUTS: Shortcut[] = [
  {
    keys: ["?"],
    description: {
      en: "Show this shortcut overlay",
      ru: "Показать справку по горячим клавишам",
    },
  },
  {
    keys: ["⌘", "K"],
    description: { en: "Open guest search", ru: "Поиск гостей" },
  },
  {
    keys: ["←"],
    description: {
      en: "Previous month (calendar)",
      ru: "Предыдущий месяц (календарь)",
    },
  },
  {
    keys: ["→"],
    description: {
      en: "Next month (calendar)",
      ru: "Следующий месяц (календарь)",
    },
  },
  {
    keys: ["T"],
    description: { en: "Jump to today (calendar)", ru: "К сегодня (календарь)" },
  },
  {
    keys: ["E"],
    description: {
      en: "Toggle Edit Dates mode (calendar)",
      ru: "Переключить режим редактирования дат (календарь)",
    },
  },
  {
    keys: ["Esc"],
    description: { en: "Close overlay", ru: "Закрыть окно" },
  },
];

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (t.isContentEditable) return true;
  return false;
}

export function KeyboardShortcuts() {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        return;
      }
      if (isTypingTarget(e.target)) return;
      // Use Shift+/ which produces "?" on standard layouts.
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#27272b] bg-[#18181b] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#27272b] px-4 py-3">
          <h2 className="text-sm font-semibold text-[#e8e8ec]">
            {locale === "ru" ? "Горячие клавиши" : "Keyboard shortcuts"}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-[#71717a] hover:bg-[#27272b] hover:text-[#e8e8ec]"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className="divide-y divide-[#27272b]">
          {SHORTCUTS.map((s, i) => (
            <li key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
              <span className="text-[#d4d4d8]">{s.description[locale === "ru" ? "ru" : "en"]}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded-md border border-[#333338] bg-[#111113] px-2 py-0.5 font-mono text-[11px] text-[#e8e8ec]"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
