"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const COOKIE = "rt-theme";

function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  // SSR and the guarded boot script already resolved cookie/storage priority.
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function writeTheme(t: Theme) {
  if (typeof window === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
  document.documentElement.style.colorScheme = t;
  try {
    window.localStorage?.setItem(COOKIE, t);
  } catch {
    // Browser privacy settings or storage quotas must not disable the toggle.
  }
  // Cookie too — so SSR can read it on the next request and avoid the
  // light → dark flash for users who chose dark on a previous visit.
  try {
    document.cookie = `${COOKIE}=${t}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } catch {
    // The chosen theme still works for this page when persistence is blocked.
  }
}

/**
 * Sun/moon button. Renders nothing on the server to avoid hydration churn —
 * the inline boot script in layout.tsx has already set the class by the
 * time this mounts.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Read browser-only state after hydration to preserve the server placeholder.
    setTheme(readTheme());
    setMounted(true);
  }, []);

  if (!mounted) {
    // Reserve the same width so the header doesn't reflow when the button
    // appears post-hydration.
    return <div className={`h-8 w-8 ${className}`} aria-hidden="true" />;
  }

  const next: Theme = theme === "light" ? "dark" : "light";
  const label = theme === "light" ? "Switch to dark mode" : "Switch to light mode";

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(next);
        writeTheme(next);
      }}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)] transition-colors ${className}`}
    >
      {theme === "light" ? (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )}
    </button>
  );
}
