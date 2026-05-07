"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface Props {
  url: string;
}

interface CopyShape {
  copyLink: string;
  copied: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: { copyLink: "Copy link", copied: "Copied!" },
  ru: { copyLink: "Скопировать ссылку", copied: "Скопировано!" },
};

/**
 * One-tap "Copy link" button for the share row. Falls back to a manual
 * select when navigator.clipboard is unavailable (older browsers, file://
 * previews, etc.) so the affordance never breaks silently.
 */
export function BlogCopyLink({ url }: Props) {
  const { locale } = useI18n();
  const t = COPY[locale];
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Legacy fallback: select a hidden textarea, execCommand("copy").
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Permissions blocked clipboard access — show the URL so the reader
      // can copy it manually instead of pretending we succeeded.
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg-2)]/40 px-2.5 py-1 text-xs font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--line-2)] hover:bg-[var(--bg-2)] hover:text-[var(--ink)]"
    >
      {copied ? t.copied : t.copyLink}
    </button>
  );
}
