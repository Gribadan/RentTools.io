"use client";

import { useEffect, useState } from "react";

// Minimal "Need help?" footer that surfaces the support_email
// SiteSetting set in the admin panel. Renders nothing if the email is
// not configured so admins who don't want to be reached aren't forced
// into a chrome change.
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
        // Silent — footer just won't render.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!email) return null;

  return (
    <div className="border-t border-[#1e2329] bg-[#0d1117] px-4 py-2 text-center text-xs text-[#71717a]">
      Need help?{" "}
      <a href={`mailto:${email}`} className="text-[#a0a0a8] hover:text-[#e8e8ec]">
        {email}
      </a>
    </div>
  );
}
