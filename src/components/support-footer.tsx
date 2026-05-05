"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";

// Footer for the logged-in app shell — Privacy, Terms, GitHub source, and
// optionally a "Need help?" support email when the admin has set one.
export function SupportFooter() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { support_email?: string } | null) => {
        if (cancelled) return;
        setEmail((data?.support_email ?? "").trim());
      })
      .catch(() => {
        // Silent — only the support email line will be missing.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="border-t border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-center text-xs text-[var(--ink-4)]">
      <p className="mb-1.5 text-[11px] text-[var(--ink-4)]">
        Essential cookies only — no tracking, no analytics. See{" "}
        <Link href="/privacy" className="underline hover:text-[var(--ink-2)]">Privacy</Link>.
      </p>
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        <span>© 2026 RentTools</span>
        <Link href="/privacy" className="hover:text-[var(--ink-2)]">Privacy</Link>
        <Link href="/terms" className="hover:text-[var(--ink-2)]">Terms</Link>
        <a
          href="https://github.com/Gribadan/RentTools.io"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--ink-2)]"
        >
          Source
        </a>
        {email && (
          <a href={`mailto:${email}`} className="hover:text-[var(--ink-2)]">
            Need help? {email}
          </a>
        )}
        <LocaleSwitcher variant="inline" reloadOnChange={false} />
      </nav>
    </div>
  );
}
