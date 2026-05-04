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

  if (alerts.length === 0) return null;

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
    <div className="border-b border-[#5a2a2a] bg-[#3d1a1a] px-4 py-2 text-sm text-[#ff9b9b]">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
        <div className="flex-1">
          <span className="font-semibold">Sync issue:</span> {summary}
          {alerts.length > 1 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-[#ffb3b3]">
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
          className="shrink-0 rounded border border-[#5a2a2a] px-2 py-1 text-xs text-[#ff9b9b] transition hover:bg-[#5a2a2a] disabled:opacity-50"
        >
          {dismissing ? "Dismissing…" : "Dismiss"}
        </button>
      </div>
    </div>
  );
}
