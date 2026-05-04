"use client";

import { useEffect, useState } from "react";

// Tiny non-cryptographic hash so we can key dismissal by content. When
// the admin edits the announcement, the hash changes and previously
// dismissed users see the new banner.
function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

const STORAGE_KEY_PREFIX = "announcement-dismissed:";

export function AnnouncementBanner() {
  const [text, setText] = useState<string>("");
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { landing_announcement?: string } | null) => {
        if (cancelled) return;
        const t = (data?.landing_announcement ?? "").trim();
        setText(t);
        if (!t) {
          setDismissed(true);
          return;
        }
        const key = STORAGE_KEY_PREFIX + hash(t);
        try {
          setDismissed(window.localStorage.getItem(key) === "1");
        } catch {
          setDismissed(false);
        }
      })
      .catch(() => {
        // Silent fall-through — banner just won't render.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!text || dismissed) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY_PREFIX + hash(text), "1");
    } catch {
      // Storage may be unavailable (private mode); just hide for the session.
    }
    setDismissed(true);
  };

  return (
    <div
      role="status"
      className="flex items-start justify-between gap-4 border-b border-[#30363d] bg-[#1f6feb]/10 px-4 py-2 text-sm text-[#c9d1d9]"
    >
      <p className="leading-snug">{text}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="-mr-1 rounded p-1 text-[#9198a1] transition-colors hover:bg-[#30363d] hover:text-[#e6edf3]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
