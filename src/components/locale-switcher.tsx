"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface LocaleOption {
  code: Locale;
  short: string;
  label: string;
  flag: string;
}

const OPTIONS: LocaleOption[] = [
  { code: "en", short: "EN", label: "English", flag: "🇬🇧" },
  { code: "ru", short: "RU", label: "Русский", flag: "🇷🇺" },
];

interface LocaleSwitcherProps {
  variant?: "dropdown" | "inline";
  className?: string;
  reloadOnChange?: boolean;
}

export function LocaleSwitcher({
  variant = "dropdown",
  className = "",
  reloadOnChange = true,
}: LocaleSwitcherProps) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const choose = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    setLocale(next);
    if (reloadOnChange && typeof window !== "undefined") {
      window.location.reload();
    }
  };

  if (variant === "inline") {
    return (
      <div
        className={`flex items-center rounded-md border border-[var(--line-2)] overflow-hidden ${className}`}
        role="group"
        aria-label="Language"
      >
        {OPTIONS.map((opt) => (
          <button
            key={opt.code}
            type="button"
            onClick={() => choose(opt.code)}
            aria-pressed={locale === opt.code}
            className={`px-2 py-1 text-xs transition-colors ${
              locale === opt.code
                ? "bg-[var(--bg-3)] text-[var(--ink)]"
                : "text-[var(--ink-4)] hover:text-[var(--ink-2)]"
            }`}
          >
            {opt.short}
          </button>
        ))}
      </div>
    );
  }

  const current = OPTIONS.find((o) => o.code === locale) ?? OPTIONS[0];

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className="flex items-center gap-1.5 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2.5 py-1.5 text-xs text-[var(--ink-2)] hover:border-[var(--ink)]/40 hover:text-[var(--ink)] transition-colors"
      >
        <span aria-hidden>{current.flag}</span>
        <span>{current.short}</span>
        <svg
          className={`h-3 w-3 text-[var(--ink-4)] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-lg border border-[var(--line-2)] bg-[var(--bg-2)] p-1 shadow-xl shadow-black/40"
        >
          {OPTIONS.map((opt) => (
            <li key={opt.code} role="none">
              <button
                type="button"
                role="option"
                aria-selected={locale === opt.code}
                onClick={() => choose(opt.code)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  locale === opt.code
                    ? "bg-[var(--bg-3)] text-[var(--ink)]"
                    : "text-[var(--ink-2)] hover:bg-[var(--bg-3)]"
                }`}
              >
                <span className="text-base" aria-hidden>
                  {opt.flag}
                </span>
                <span className="flex-1 text-left">{opt.label}</span>
                {locale === opt.code && (
                  <svg
                    className="h-3.5 w-3.5 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
