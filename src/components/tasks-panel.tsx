"use client";

import { useEffect, useState, useCallback } from "react";
import type { SyncLogEntry } from "@/lib/types";

interface ScheduleSettings {
  autoEnabled: boolean;
  frequencyMinutes: number;
  lastRun: string | null;
  lastResult: string | null;
}

export function TasksPanel() {
  const [schedule, setSchedule] = useState<ScheduleSettings>({
    autoEnabled: true,
    frequencyMinutes: 10,
    lastRun: null,
    lastResult: null,
  });
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [logLimit, setLogLimit] = useState(100);

  const fetchData = useCallback(async () => {
    const [schedRes, logsRes] = await Promise.all([
      fetch("/api/calendar/schedule"),
      fetch(`/api/calendar/sync?limit=${logLimit}`),
    ]);
    if (schedRes.ok) setSchedule(await schedRes.json());
    if (logsRes.ok) {
      const data = await logsRes.json();
      setLogs(data.logs || []);
    }
  }, [logLimit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleAuto = async () => {
    const newValue = !schedule.autoEnabled;
    await fetch("/api/calendar/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoEnabled: newValue }),
    });
    setSchedule((s) => ({ ...s, autoEnabled: newValue }));
  };

  const handleFrequencyChange = async (minutes: number) => {
    await fetch("/api/calendar/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frequencyMinutes: minutes }),
    });
    setSchedule((s) => ({ ...s, frequencyMinutes: minutes }));
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/calendar/sync", { method: "POST" });
      await fetchData();
    } finally {
      setSyncing(false);
    }
  };

  const parsedResult = (() => {
    if (!schedule.lastResult) return null;
    try { return JSON.parse(schedule.lastResult); } catch { return null; }
  })();

  const timeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const cronUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/calendar/cron?secret=${encodeURIComponent("rent-tool-secret-key-change-in-production-2024")}`
    : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#f0f6fc]">Tasks</h1>
          <p className="mt-0.5 text-sm text-[#9198a1]">Calendar sync scheduler and logs</p>
        </div>
        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="flex items-center gap-1.5 rounded-md bg-[#238636] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2ea043] disabled:opacity-50"
        >
          <svg className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {syncing ? "Syncing..." : "Run Sync Now"}
        </button>
      </div>

      {/* Status Card */}
      <div className="rounded-lg border border-[#21262d] bg-[#161b22] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#f0f6fc]">Automatic Sync</h2>
          {/* Toggle */}
          <button
            onClick={handleToggleAuto}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              schedule.autoEnabled ? "bg-[#238636]" : "bg-[#21262d]"
            }`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              schedule.autoEnabled ? "left-[22px]" : "left-0.5"
            }`} />
          </button>
        </div>

        {schedule.autoEnabled && (
          <>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#9198a1]">Sync every</span>
              <div className="relative">
                <select
                  value={schedule.frequencyMinutes}
                  onChange={(e) => handleFrequencyChange(Number(e.target.value))}
                  className="h-8 appearance-none rounded-md border border-[#30363d] bg-[#0d1117] pl-3 pr-8 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={360}>6 hours</option>
                  <option value={720}>12 hours</option>
                  <option value={1440}>24 hours</option>
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8590]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </div>
            </div>

            <div className="rounded-md border border-[#30363d] bg-[#0d1117] p-3 space-y-2">
              <p className="text-xs font-medium text-[#9198a1]">Setup: add this URL to a free cron service</p>
              <code className="block text-xs text-[#c9d1d9] break-all select-all cursor-pointer rounded bg-[#161b22] p-2 border border-[#21262d]">{cronUrl}</code>
              <div className="text-xs text-[#7d8590] space-y-1">
                <p>Vercel free plan only runs cron once per day. For more frequent sync, use a free external service:</p>
                <p>
                  <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] hover:underline">cron-job.org</a>
                  {" "}— free, supports every 1 minute. Create account → New Job → paste the URL above → set your interval.
                </p>
                <p>Vercel daily cron also runs at 6:00 AM UTC as a fallback.</p>
              </div>
            </div>
          </>
        )}

        {/* Last run info */}
        <div className="border-t border-[#21262d] pt-3 space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#9198a1]">Last sync:</span>
            {schedule.lastRun ? (
              <span className="text-sm text-[#f0f6fc]">{timeSince(schedule.lastRun)}</span>
            ) : (
              <span className="text-sm text-[#7d8590]">Never</span>
            )}
          </div>
          {parsedResult && !parsedResult.error && (
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="text-[#9198a1]">
                {parsedResult.propertiesSynced || 0} propert{(parsedResult.propertiesSynced || 0) !== 1 ? "ies" : "y"}
              </span>
              <span className="text-[#3fb950]">+{parsedResult.newEvents || 0} new</span>
              <span className="text-[#f85149]">-{parsedResult.removedEvents || 0} removed</span>
              {(parsedResult.errors || 0) > 0 && (
                <span className="text-[#f85149]">{parsedResult.errors} errors</span>
              )}
            </div>
          )}
          {parsedResult?.error && (
            <p className="text-xs text-[#f85149]">Error: {parsedResult.error}</p>
          )}
        </div>
      </div>

      {/* Full Sync Log */}
      <div className="rounded-lg border border-[#21262d] bg-[#161b22]">
        <div className="flex items-center justify-between border-b border-[#21262d] px-4 py-3">
          <h2 className="text-sm font-medium text-[#9198a1]">Sync Log ({logs.length})</h2>
          <div className="flex items-center gap-2">
            <select
              value={logLimit}
              onChange={(e) => setLogLimit(Number(e.target.value))}
              className="h-7 appearance-none rounded-md border border-[#30363d] bg-[#0d1117] pl-2 pr-6 text-xs text-[#f0f6fc] outline-none"
            >
              <option value={50}>Last 50</option>
              <option value={100}>Last 100</option>
              <option value={500}>Last 500</option>
            </select>
            <button
              onClick={fetchData}
              className="rounded-md px-2 py-1 text-xs text-[#9198a1] hover:bg-[#1c2128] hover:text-[#f0f6fc]"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#7d8590]">
              No sync logs yet. Run a sync to see activity here.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#21262d] text-left">
                  <th className="px-4 py-2 text-xs font-medium text-[#7d8590] w-[140px]">Time</th>
                  <th className="px-4 py-2 text-xs font-medium text-[#7d8590] w-[70px]">Level</th>
                  <th className="px-4 py-2 text-xs font-medium text-[#7d8590]">Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#21262d]/50 hover:bg-[#1c2128]">
                    <td className="px-4 py-2 text-xs text-[#7d8590] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-GB", {
                        day: "2-digit", month: "short",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                        log.level === "error" ? "bg-[#f85149]/10 text-[#f85149]"
                        : log.level === "success" ? "bg-[#3fb950]/10 text-[#3fb950]"
                        : log.level === "warn" ? "bg-[#d29922]/10 text-[#d29922]"
                        : "bg-[#21262d] text-[#9198a1]"
                      }`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-[#c9d1d9]">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
