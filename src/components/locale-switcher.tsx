"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import { swapLocaleInPath } from "@/lib/i18n/alternates";

// Inline SVG flags. We can't use 🇬🇧 / 🇷🇺 emojis here because Windows
// desktop browsers render regional indicator chars as plain letters
// (you see "GB" / "RU" boxes instead of a flag) — fine on iOS / Android /
// Mac which ship a flag-capable emoji font, broken on Windows. SVGs
// dodge the OS font fallback entirely.
function FlagGB({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0 L24 16 M24 0 L0 16" stroke="white" strokeWidth="3.2" />
      <path d="M0 0 L24 16 M24 0 L0 16" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M12 0 V16 M0 8 H24" stroke="white" strokeWidth="5.3" />
      <path d="M12 0 V16 M0 8 H24" stroke="#C8102E" strokeWidth="3.2" />
    </svg>
  );
}

function FlagRU({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="5.34" y="0" fill="white" />
      <rect width="24" height="5.34" y="5.33" fill="#0039A6" />
      <rect width="24" height="5.34" y="10.66" fill="#D52B1E" />
    </svg>
  );
}

function FlagDE({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="5.34" y="0" fill="#000000" />
      <rect width="24" height="5.34" y="5.33" fill="#DD0000" />
      <rect width="24" height="5.34" y="10.66" fill="#FFCE00" />
    </svg>
  );
}

function FlagFR({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="8" height="16" x="0" fill="#0055A4" />
      <rect width="8" height="16" x="8" fill="#FFFFFF" />
      <rect width="8" height="16" x="16" fill="#EF4135" />
    </svg>
  );
}

function FlagFor({ code, className }: { code: Locale; className?: string }) {
  if (code === "ru") return <FlagRU className={className} />;
  if (code === "de") return <FlagDE className={className} />;
  if (code === "fr") return <FlagFR className={className} />;
  return <FlagGB className={className} />;
}

interface LocaleOption {
  code: Locale;
  short: string;
  label: string;
}

const OPTIONS: LocaleOption[] = [
  { code: "en", short: "EN", label: "English" },
  { code: "ru", short: "RU", label: "Русский" },
  { code: "de", short: "DE", label: "Deutsch" },
  { code: "fr", short: "FR", label: "Français" },
];

interface LocaleSwitcherProps {
  variant?: "dropdown" | "inline";
  className?: string;
  reloadOnChange?: boolean;
}

export function LocaleSwitcher({
  variant = "dropdown",
  className = "",
  reloadOnChange: _reloadOnChange = true,
}: LocaleSwitcherProps) {
  const { locale, setLocale } = useI18n();
  const pathname = usePathname();
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

  // URL is authoritative for locale (Google needs distinct URLs per
  // language). Cookie is still set as a soft preference so middleware
  // can fall back when a visitor lands on a non-localizable path.
  //
  // Hard navigation (window.location.assign) instead of router.push:
  // App Router's soft navigation reuses the React tree across /blog
  // and /ru/blog because both URLs render via the same page file
  // (middleware rewrites internally). The header reflows from the
  // I18n context flip, but the server-rendered body keeps its old
  // RSC payload — visually the page header changes language while
  // the article body stays in the original language. A real reload
  // forces middleware to re-resolve x-locale from the new URL prefix
  // and the server component to re-render against it. Slight cost
  // (~200-400ms full page load vs instant soft transition), worth
  // it for the language switch — it's a once-per-session action and
  // partial-flip looks broken.
  const choose = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    setLocale(next);
    const target = swapLocaleInPath(pathname ?? "/", next);
    if (typeof window !== "undefined") {
      window.location.assign(target);
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
        <FlagFor code={current.code} className="h-3 w-[18px] rounded-[1px] border border-[var(--line-2)]" />
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
                <FlagFor code={opt.code} className="h-3.5 w-[21px] shrink-0 rounded-[1px] border border-[var(--line-2)]" />
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
