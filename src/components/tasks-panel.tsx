"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { SyncLogEntry } from "@/lib/types";

interface ScheduleSettings {
  autoEnabled: boolean;
  frequencyMinutes: number;
  lastRun: string | null;
  lastResult: string | null;
}

interface PropertyEventCounts {
  id: number;
  name: string;
  airbnb: number;
  booking: number;
}

export function TasksPanel() {
  const { t } = useI18n();
  const [schedule, setSchedule] = useState<ScheduleSettings>({
    autoEnabled: true,
    frequencyMinutes: 10,
    lastRun: null,
    lastResult: null,
  });
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [logLimit, setLogLimit] = useState(100);
  const [eventCounts, setEventCounts] = useState<PropertyEventCounts[]>([]);

  const fetchData = useCallback(async () => {
    const [schedRes, logsRes, propsRes] = await Promise.all([
      fetch("/api/calendar/schedule"),
      fetch(`/api/calendar/sync?limit=${logLimit}`),
      fetch("/api/properties"),
    ]);
    if (schedRes.ok) setSchedule(await schedRes.json());
    let allEvents: { propertyId: number; platform: string }[] = [];
    if (logsRes.ok) {
      const data = await logsRes.json();
      setLogs(data.logs || []);
      allEvents = data.events || [];
    }
    if (propsRes.ok) {
      const props: { id: number; name: string }[] = await propsRes.json();
      const counts = props.map((p) => ({
        id: p.id,
        name: p.name,
        airbnb: allEvents.filter((e) => e.propertyId === p.id && e.platform === "airbnb").length,
        booking: allEvents.filter((e) => e.propertyId === p.id && e.platform === "booking").length,
      }));
      setEventCounts(counts);
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

  const [cronUrl, setCronUrl] = useState<string | null>(null);
  const [cronUrlConfigured, setCronUrlConfigured] = useState(true);

  useEffect(() => {
    fetch("/api/calendar/cron-url")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setCronUrl(data.url);
        setCronUrlConfigured(!!data.configured);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">{t("tasks.title")}</h1>
          <p className="mt-0.5 text-sm text-[var(--ink-3)]">{t("tasks.subtitle")}</p>
        </div>
        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="flex items-center gap-1.5 rounded-md bg-[var(--m-accent)] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-50"
        >
          <svg className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {syncing ? t("tasks.syncing") : t("tasks.runSync")}
        </button>
      </div>

      {/* Status Card */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--ink)]">{t("tasks.autoSync")}</h2>
          {/* Toggle */}
          <button
            onClick={handleToggleAuto}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              schedule.autoEnabled ? "bg-[var(--m-accent)]" : "bg-[var(--line-2)]"
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
              <span className="text-sm text-[var(--ink-3)]">{t("tasks.syncEvery")}</span>
              <div className="relative">
                <select
                  value={schedule.frequencyMinutes}
                  onChange={(e) => handleFrequencyChange(Number(e.target.value))}
                  className="h-8 appearance-none rounded-md border border-[var(--line-2)] bg-[var(--bg)] pl-3 pr-8 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
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
                <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </div>
            </div>

            <div className="rounded-md border border-[var(--line-2)] bg-[var(--bg)] p-3 space-y-2">
              <p className="text-xs font-medium text-[var(--ink-3)]">Self-hosters: trigger this URL from cron</p>
              {cronUrl ? (
                <code className="block text-xs text-[var(--ink-2)] break-all select-all cursor-pointer rounded bg-[var(--bg-2)] p-2 border border-[var(--line)]">{cronUrl}</code>
              ) : (
                <p className="text-xs text-[var(--ink-4)] italic">
                  {cronUrlConfigured ? "Loading…" : "Set CRON_SECRET in your environment to enable this URL."}
                </p>
              )}
              <p className="text-xs text-[var(--ink-4)]">
                On the hosted instance this runs from the system cron every 10 minutes. Self-hosters can wire it into <code className="text-[var(--ink-3)]">crontab</code> or any external scheduler (e.g. <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-[var(--ink)] hover:underline">cron-job.org</a>).
              </p>
            </div>
          </>
        )}

        {/* Last run info */}
        <div className="border-t border-[var(--line)] pt-3 space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--ink-3)]">{t("tasks.lastSync")}</span>
            {schedule.lastRun ? (
              <span className="text-sm text-[var(--ink)]">{timeSince(schedule.lastRun)}</span>
            ) : (
              <span className="text-sm text-[var(--ink-4)]">{t("tasks.never")}</span>
            )}
          </div>
          {parsedResult && !parsedResult.error && (
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="text-[var(--ink-3)]">
                {parsedResult.propertiesSynced || 0} propert{(parsedResult.propertiesSynced || 0) !== 1 ? "ies" : "y"}
              </span>
              <span className="text-emerald-500">+{parsedResult.newEvents || 0} new</span>
              <span className="text-rose-500">-{parsedResult.removedEvents || 0} removed</span>
              {(parsedResult.errors || 0) > 0 && (
                <span className="text-rose-500">{parsedResult.errors} errors</span>
              )}
            </div>
          )}
          {parsedResult?.error && (
            <p className="text-xs text-rose-500">Error: {parsedResult.error}</p>
          )}

          {eventCounts.length > 0 && (
            <div className="border-t border-[var(--line)]/60 pt-3 mt-2 space-y-1">
              <p className="text-xs font-medium text-[var(--ink-4)]">Per-platform events</p>
              {eventCounts.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="truncate text-[var(--ink-2)]">{p.name}</span>
                  <span className="shrink-0 text-[var(--ink-3)]">
                    Airbnb: <span className="text-[var(--m-accent)]">{p.airbnb}</span>
                    {" · "}
                    Booking: <span className="text-sky-300">{p.booking}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Sync Log */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <h2 className="text-sm font-medium text-[var(--ink-3)]">{t("tasks.syncLog")} ({logs.length})</h2>
          <div className="flex items-center gap-2">
            <select
              value={logLimit}
              onChange={(e) => setLogLimit(Number(e.target.value))}
              className="h-7 appearance-none rounded-md border border-[var(--line-2)] bg-[var(--bg)] pl-2 pr-6 text-xs text-[var(--ink)] outline-none"
            >
              <option value={50}>Last 50</option>
              <option value={100}>Last 100</option>
              <option value={500}>Last 500</option>
            </select>
            <button
              onClick={fetchData}
              className="rounded-md px-2 py-1 text-xs text-[var(--ink-3)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)]"
            >
              {t("common.refresh")}
            </button>
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--ink-4)]">
              {t("tasks.noLogs")}
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--line)] text-left">
                  <th className="px-4 py-2 text-xs font-medium text-[var(--ink-4)] w-[140px]">{t("tasks.time")}</th>
                  <th className="px-4 py-2 text-xs font-medium text-[var(--ink-4)] w-[70px]">{t("tasks.level")}</th>
                  <th className="px-4 py-2 text-xs font-medium text-[var(--ink-4)]">{t("tasks.message")}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[var(--line)]/50 hover:bg-[var(--bg-3)]">
                    <td className="px-4 py-2 text-xs text-[var(--ink-4)] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-GB", {
                        day: "2-digit", month: "short",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                        log.level === "error" ? "bg-rose-500/10 text-rose-500"
                        : log.level === "success" ? "bg-emerald-500/10 text-emerald-500"
                        : log.level === "warn" ? "bg-amber-400/10 text-amber-400"
                        : "bg-[var(--line-2)] text-[var(--ink-3)]"
                      }`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-[var(--ink-2)]">{log.message}</td>
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
