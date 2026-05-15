"use client";

import { useState } from "react";
import { useSession } from "@/lib/session-context";

/**
 * Top-of-page banner shown only when the current session is a
 * superadmin impersonating another user. Renders nothing for normal
 * sessions, so it can sit unconditionally in the root layout.
 *
 * The banner is sticky-top with high z-index so it covers everything
 * including modals — the impersonation state is the single most
 * important thing on the page when it's active. The exit pill POSTs
 * to /api/admin/exit-impersonation which restores the admin's
 * original session, then full-reloads so every server component re-
 * renders against the restored userId.
 */
export function ImpersonationBanner() {
  const session = useSession();
  const [exiting, setExiting] = useState(false);

  if (!session?.impersonatorId) return null;

  const exit = async () => {
    setExiting(true);
    try {
      const res = await fetch("/api/admin/exit-impersonation", { method: "POST" });
      if (res.ok) {
        // Hard nav — every server-rendered page rebuilds against the
        // restored admin session. Soft router.push would reuse stale
        // RSC payloads that were rendered against the target user's
        // permissions.
        window.location.href = "/dashboard/admin/workspace/users";
        return;
      }
      // 410 = side cookie expired. Send to /login so the admin can
      // re-auth as themselves.
      if (res.status === 410) {
        window.location.href = "/login";
        return;
      }
      setExiting(false);
    } catch {
      setExiting(false);
    }
  };

  return (
    <div
      role="alert"
      className="sticky top-0 z-[60] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950 shadow-lg shadow-amber-500/20"
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <span className="truncate">
        Viewing as <strong>{session.username}</strong>
        {session.impersonatorUsername ? (
          <> · signed in as <strong>{session.impersonatorUsername}</strong></>
        ) : null}
      </span>
      <button
        type="button"
        onClick={exit}
        disabled={exiting}
        className="rounded-md bg-amber-950/15 px-3 py-1 text-xs font-semibold transition-colors hover:bg-amber-950/25 disabled:opacity-60"
      >
        {exiting ? "Exiting…" : "Exit impersonation"}
      </button>
    </div>
  );
}
