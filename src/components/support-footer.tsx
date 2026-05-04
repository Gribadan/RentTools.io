"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    <div className="border-t border-[#1e2329] bg-[#0d1117] px-4 py-3 text-center text-xs text-[#71717a]">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        <span>© 2026 RentTools</span>
        <Link href="/privacy" className="hover:text-[#a0a0a8]">Privacy</Link>
        <Link href="/terms" className="hover:text-[#a0a0a8]">Terms</Link>
        <a
          href="https://github.com/Gribadan/RentTools.io"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#a0a0a8]"
        >
          Source
        </a>
        {email && (
          <a href={`mailto:${email}`} className="hover:text-[#a0a0a8]">
            Need help? {email}
          </a>
        )}
      </nav>
    </div>
  );
}
