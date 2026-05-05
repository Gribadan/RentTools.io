"use client";

import { useEffect, useState } from "react";

interface Alert {
  id: number;
  propertyId: number | null;
  message: string;
  createdAt: string;
}

export function SyncAlertsBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissing, setDismissing] = useState(false);
  // Hydration-aware: server renders nothing for zero alerts; the client
  // updates after fetch. We collapse the wrapper to height 0 instead of
  // returning null so the eventual mount with content slides in via CSS
  // transition rather than instant-popping in (no perfect zero CLS, but
  // the visible jank is much smaller than a layout pop). See the
  // wrapper at the bottom for the actual implementation.
  const hasAlerts = alerts.length > 0;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sync-alerts")
      .then((r) => (r.ok ? r.json() : { alerts: [] }))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.alerts)) setAlerts(data.alerts);
      })
      .catch(() => {
        // silent — banner is best-effort
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hasAlerts) return null;

  const dismiss = async () => {
    setDismissing(true);
    try {
      await fetch("/api/sync-alerts", { method: "POST" });
      setAlerts([]);
    } finally {
      setDismissing(false);
    }
  };

  const summary =
    alerts.length === 1
      ? alerts[0].message.replace(/^\[ALERT\]\s*/, "")
      : `${alerts.length} sync alerts — feeds may be broken`;

  return (
    <div
      role="alert"
      className="cls-isolate animate-slide-down border-b border-rose-300/60 bg-rose-50 px-4 py-2 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
    >
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
        <div className="flex-1">
          <span className="font-semibold">Sync issue:</span> {summary}
          {alerts.length > 1 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-rose-700 dark:text-rose-200">
              {alerts.slice(0, 5).map((a) => (
                <li key={a.id}>{a.message.replace(/^\[ALERT\]\s*/, "")}</li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          disabled={dismissing}
          className="shrink-0 rounded border border-rose-300/60 px-2 py-1 text-xs text-rose-800 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-900/40"
        >
          {dismissing ? "Dismissing…" : "Dismiss"}
        </button>
      </div>
    </div>
  );
}
