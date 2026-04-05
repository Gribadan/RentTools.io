"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CalendarLink, CalendarEvent, SyncLogEntry } from "@/lib/types";

interface CalendarSyncProps {
  propertyId: number;
  propertyName: string;
}

/* ────────────────────────────────── helpers ────────────────────────────── */

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function fmtDate(d: Date) {
  return d.toISOString().substring(0, 10);
}
function parseYMD(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/* ────────────────────────────── calendar grid ─────────────────────────── */

interface CalendarDay {
  date: Date;
  dateStr: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  airbnb: boolean;   // booked on airbnb
  booking: boolean;  // booked on booking
  bufferDay: boolean; // buffer day (our addition)
}

function buildCalendarMonths(
  year: number,
  month: number, // 0-indexed
  monthCount: number,
  events: CalendarEvent[],
  links: CalendarLink[],
) {
  // Build a set of booked date strings per platform
  const airbnbDates = new Set<string>();
  const bookingDates = new Set<string>();

  for (const ev of events) {
    const start = parseYMD(ev.startDate);
    const end = parseYMD(ev.endDate);
    const set = ev.platform === "booking" ? bookingDates : airbnbDates;
    for (let d = new Date(start); d < end; d = addDays(d, 1)) {
      set.add(fmtDate(d));
    }
  }

  // Build buffer dates — dates that are NOT in any booking but would be blocked by buffer
  const bufferDates = new Set<string>();
  const airbnbLink = links.find((l) => l.platform === "airbnb");
  const bookingLink = links.find((l) => l.platform === "booking");

  for (const ev of events) {
    const start = parseYMD(ev.startDate);
    const end = parseYMD(ev.endDate);
    const link = ev.platform === "airbnb" ? airbnbLink : bookingLink;
    const bBefore = link?.bufferBefore ?? 1;
    const bAfter = link?.bufferAfter ?? 1;

    for (let i = 1; i <= bBefore; i++) {
      const d = fmtDate(addDays(start, -i));
      if (!airbnbDates.has(d) && !bookingDates.has(d)) bufferDates.add(d);
    }
    for (let i = 0; i < bAfter; i++) {
      const d = fmtDate(addDays(end, i));
      if (!airbnbDates.has(d) && !bookingDates.has(d)) bufferDates.add(d);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = fmtDate(today);

  const months: { year: number; month: number; label: string; days: CalendarDay[] }[] = [];

  for (let m = 0; m < monthCount; m++) {
    const mDate = new Date(year, month + m, 1);
    const mYear = mDate.getFullYear();
    const mMonth = mDate.getMonth();
    const label = `${MONTH_NAMES[mMonth]} ${mYear}`;

    // First day of month — shift to Monday-start (0=Mon..6=Sun)
    const firstDow = (mDate.getDay() + 6) % 7;
    const daysInMonth = new Date(mYear, mMonth + 1, 0).getDate();

    const days: CalendarDay[] = [];

    // Leading empty days
    for (let i = 0; i < firstDow; i++) {
      const d = addDays(mDate, -(firstDow - i));
      const ds = fmtDate(d);
      days.push({
        date: d, dateStr: ds, isToday: ds === todayStr, isCurrentMonth: false,
        airbnb: airbnbDates.has(ds), booking: bookingDates.has(ds), bufferDay: bufferDates.has(ds),
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(mYear, mMonth, i);
      const ds = fmtDate(d);
      days.push({
        date: d, dateStr: ds, isToday: ds === todayStr, isCurrentMonth: true,
        airbnb: airbnbDates.has(ds), booking: bookingDates.has(ds), bufferDay: bufferDates.has(ds),
      });
    }

    // Trailing to fill last week
    while (days.length % 7 !== 0) {
      const d = addDays(new Date(mYear, mMonth, daysInMonth), days.length - firstDow - daysInMonth + 1);
      const ds = fmtDate(d);
      days.push({
        date: d, dateStr: ds, isToday: ds === todayStr, isCurrentMonth: false,
        airbnb: airbnbDates.has(ds), booking: bookingDates.has(ds), bufferDay: bufferDates.has(ds),
      });
    }

    months.push({ year: mYear, month: mMonth, label, days });
  }

  return months;
}

/* ────────────────────────────── test result ────────────────────────────── */

interface TestResult {
  success: boolean;
  error?: string;
  totalEvents?: number;
  futureEvents?: number;
  pastEvents?: number;
  events?: { summary: string; startDate: string; endDate: string }[];
}

/* ────────────────────────────── main component ────────────────────────── */

export function CalendarSync({ propertyId }: CalendarSyncProps) {
  const [links, setLinks] = useState<CalendarLink[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [bufferBefore, setBufferBefore] = useState(1);
  const [bufferAfter, setBufferAfter] = useState(1);
  const [testing, setTesting] = useState<string | null>(null); // platform being tested
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [calOffset, setCalOffset] = useState(0); // month offset for calendar nav

  const fetchData = useCallback(async () => {
    const [linksRes, syncRes] = await Promise.all([
      fetch(`/api/calendar/links?propertyId=${propertyId}`),
      fetch(`/api/calendar/sync?propertyId=${propertyId}&limit=30`),
    ]);
    const linksData = await linksRes.json();
    const syncData = await syncRes.json();
    setLinks(Array.isArray(linksData) ? linksData : []);
    setEvents(syncData.events || []);
    setLogs(syncData.logs || []);
  }, [propertyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── actions ── */

  const handleSaveLink = async (platform: string) => {
    if (!urlInput.trim()) return;
    await fetch("/api/calendar/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, platform, icalExportUrl: urlInput.trim(), bufferBefore, bufferAfter }),
    });
    setEditingLink(null);
    setUrlInput("");
    setBufferBefore(1);
    setBufferAfter(1);
    await fetchData();
  };

  const handleDeleteLink = async (id: number) => {
    await fetch(`/api/calendar/links/${id}`, { method: "DELETE" });
    await fetchData();
  };

  const handleUpdateBuffer = async (id: number, field: "bufferBefore" | "bufferAfter", value: number) => {
    await fetch(`/api/calendar/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    await fetchData();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/calendar/sync", { method: "POST" });
      await fetchData();
    } finally {
      setSyncing(false);
    }
  };

  const handleTest = async (platform: string) => {
    const link = links.find((l) => l.platform === platform);
    if (!link) return;
    setTesting(platform);
    setTestResult(null);
    try {
      const res = await fetch("/api/calendar/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link.icalExportUrl }),
      });
      setTestResult(await res.json());
    } catch (err) {
      setTestResult({ success: false, error: String(err) });
    } finally {
      setTesting(null);
    }
  };

  const handleTestUrl = async (url: string) => {
    setTesting("input");
    setTestResult(null);
    try {
      const res = await fetch("/api/calendar/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      setTestResult(await res.json());
    } catch (err) {
      setTestResult({ success: false, error: String(err) });
    } finally {
      setTesting(null);
    }
  };

  const startEdit = (platform: string) => {
    const existing = links.find((l) => l.platform === platform);
    setEditingLink(platform);
    setUrlInput(existing?.icalExportUrl || "");
    setBufferBefore(existing?.bufferBefore ?? 1);
    setBufferAfter(existing?.bufferAfter ?? 1);
    setTestResult(null);
  };

  const copyFeedUrl = (forPlatform: string) => {
    const url = `${window.location.origin}/api/calendar/feed/${propertyId}?for=${forPlatform}`;
    navigator.clipboard.writeText(url);
    setCopied(forPlatform);
    setTimeout(() => setCopied(null), 2000);
  };

  const feedUrl = (forPlatform: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/calendar/feed/${propertyId}?for=${forPlatform}`;
  };

  /* ── calendar data ── */

  const now = new Date();
  const calMonths = useMemo(() => {
    return buildCalendarMonths(now.getFullYear(), now.getMonth() + calOffset, 3, events, links);
  }, [events, links, calOffset]);

  const airbnbLink = links.find((l) => l.platform === "airbnb");
  const bookingLink = links.find((l) => l.platform === "booking");
  const hasLinks = links.length > 0;
  const today = fmtDate(now);
  const futureEvents = events.filter((e) => e.endDate >= today);

  /* ────────────────────────────── render ───────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#f0f6fc]">Calendar Sync</h2>
          <p className="text-xs text-[#7d8590] mt-0.5">
            Sync Airbnb & Booking with buffer days for cleaning
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing || !hasLinks}
          className="h-8 w-full sm:w-auto rounded-md bg-[#238636] px-4 text-xs font-medium text-white hover:bg-[#2ea043] disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      {/* ── Platform Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(["airbnb", "booking"] as const).map((platform) => {
          const link = platform === "airbnb" ? airbnbLink : bookingLink;
          const isEditing = editingLink === platform;
          const color = platform === "airbnb" ? "#FF5A5F" : "#003580";
          const textColor = platform === "airbnb" ? "#f78166" : "#79c0ff";
          const platformLabel = platform === "airbnb" ? "Airbnb" : "Booking.com";

          return (
            <div key={platform} className="rounded-lg border border-[#21262d] bg-[#0d1117] p-3 sm:p-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold" style={{ color: textColor }}>{platformLabel}</span>
                {link && !link.lastError && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-[#3fb950]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950]" />
                    Connected
                  </span>
                )}
                {link?.lastError && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-[#f85149]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f85149]" />
                    Error
                  </span>
                )}
              </div>

              {/* Connected state */}
              {link && !isEditing ? (
                <div className="space-y-3">
                  {/* URL */}
                  <div className="flex items-center gap-1.5">
                    <code className="flex-1 truncate rounded bg-[#161b22] px-2 py-1.5 text-[11px] text-[#9198a1] border border-[#30363d]">
                      {link.icalExportUrl}
                    </code>
                    <button onClick={() => startEdit(platform)} className="shrink-0 rounded p-1.5 text-[#7d8590] hover:bg-[#161b22] hover:text-[#f0f6fc]" title="Edit">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                    </button>
                    <button onClick={() => handleDeleteLink(link.id)} className="shrink-0 rounded p-1.5 text-[#7d8590] hover:bg-[#161b22] hover:text-[#f85149]" title="Remove">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {/* Buffers + Test row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#7d8590]">Buffer:</span>
                      <select value={link.bufferBefore} onChange={(e) => handleUpdateBuffer(link.id, "bufferBefore", Number(e.target.value))} className="h-6 rounded border border-[#30363d] bg-[#161b22] px-1.5 text-[11px] text-[#f0f6fc] outline-none">
                        {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}d before</option>)}
                      </select>
                      <select value={link.bufferAfter} onChange={(e) => handleUpdateBuffer(link.id, "bufferAfter", Number(e.target.value))} className="h-6 rounded border border-[#30363d] bg-[#161b22] px-1.5 text-[11px] text-[#f0f6fc] outline-none">
                        {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}d after</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => handleTest(platform)}
                      disabled={testing === platform}
                      className="flex items-center gap-1 rounded bg-[#21262d] px-2 py-1 text-[11px] text-[#c9d1d9] hover:bg-[#30363d] disabled:opacity-50"
                    >
                      {testing === platform ? "Testing..." : "Test Connection"}
                    </button>
                  </div>

                  {/* Last sync */}
                  {link.lastFetchedAt && (
                    <p className="text-[11px] text-[#7d8590]">
                      Last synced: {new Date(link.lastFetchedAt).toLocaleString()}
                    </p>
                  )}
                  {link.lastError && (
                    <p className="text-[11px] text-[#f85149]">{link.lastError}</p>
                  )}

                  {/* Test result */}
                  {testResult && testing === null && (
                    <div className={`rounded-md p-2.5 text-[11px] ${testResult.success ? "bg-[#3fb950]/10 text-[#3fb950]" : "bg-[#f85149]/10 text-[#f85149]"}`}>
                      {testResult.success ? (
                        <div>
                          <p className="font-semibold">Connection successful</p>
                          <p className="text-[#9198a1] mt-0.5">{testResult.futureEvents} upcoming · {testResult.pastEvents} past · {testResult.totalEvents} total events</p>
                          {testResult.events && testResult.events.length > 0 && (
                            <div className="mt-1.5 space-y-0.5">
                              {testResult.events.slice(0, 5).map((ev, i) => (
                                <p key={i} className="text-[#c9d1d9]">{ev.startDate} → {ev.endDate} · {ev.summary}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p>{testResult.error}</p>
                      )}
                    </div>
                  )}

                  {/* Import URL — what to paste INTO this platform */}
                  {links.length >= 2 && (
                    <div className="rounded-md bg-[#161b22] border border-[#30363d] p-2.5">
                      <p className="text-[11px] text-[#7d8590] mb-1.5">
                        Paste this URL into <strong className="text-[#c9d1d9]">{platformLabel}</strong>&apos;s calendar import settings:
                      </p>
                      <div className="flex items-center gap-1.5">
                        <code className="flex-1 truncate rounded bg-[#0d1117] px-2 py-1 text-[10px] text-[#c9d1d9] border border-[#30363d]">
                          {feedUrl(platform)}
                        </code>
                        <button
                          onClick={() => copyFeedUrl(platform)}
                          className="shrink-0 rounded bg-[#21262d] px-2 py-1 text-[11px] text-[#c9d1d9] hover:bg-[#30363d]"
                        >
                          {copied === platform ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isEditing ? (
                /* Add / Edit form */
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[11px] text-[#7d8590] block mb-1">iCal URL from {platformLabel}</span>
                    <input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={platform === "airbnb" ? "https://www.airbnb.com/calendar/ical/..." : "https://admin.booking.com/...ical..."}
                      className="h-8 w-full rounded border border-[#30363d] bg-[#0d1117] px-2.5 text-xs text-[#f0f6fc] placeholder-[#7d8590] outline-none focus:border-[#58a6ff]"
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[#7d8590]">Buffer:</span>
                      <select value={bufferBefore} onChange={(e) => setBufferBefore(Number(e.target.value))} className="h-6 rounded border border-[#30363d] bg-[#161b22] px-1.5 text-[11px] text-[#f0f6fc] outline-none">
                        {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}d before</option>)}
                      </select>
                      <select value={bufferAfter} onChange={(e) => setBufferAfter(Number(e.target.value))} className="h-6 rounded border border-[#30363d] bg-[#161b22] px-1.5 text-[11px] text-[#f0f6fc] outline-none">
                        {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}d after</option>)}
                      </select>
                    </div>
                    {urlInput.trim() && (
                      <button
                        onClick={() => handleTestUrl(urlInput.trim())}
                        disabled={testing === "input"}
                        className="flex items-center gap-1 rounded bg-[#21262d] px-2 py-1 text-[11px] text-[#c9d1d9] hover:bg-[#30363d] disabled:opacity-50"
                      >
                        {testing === "input" ? "Testing..." : "Test"}
                      </button>
                    )}
                  </div>

                  {/* Test result inline */}
                  {testResult && testing === null && (
                    <div className={`rounded-md p-2 text-[11px] ${testResult.success ? "bg-[#3fb950]/10 text-[#3fb950]" : "bg-[#f85149]/10 text-[#f85149]"}`}>
                      {testResult.success
                        ? <span>Valid iCal — {testResult.futureEvents} upcoming events found</span>
                        : <span>{testResult.error}</span>
                      }
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={() => handleSaveLink(platform)} className="h-7 rounded bg-[#238636] px-3 text-xs text-white hover:bg-[#2ea043]">Save</Button>
                    <button onClick={() => { setEditingLink(null); setUrlInput(""); setTestResult(null); }} className="h-7 rounded px-3 text-xs text-[#9198a1] hover:text-[#f0f6fc]">Cancel</button>
                  </div>
                </div>
              ) : (
                /* Not configured */
                <button
                  onClick={() => startEdit(platform)}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#30363d] py-6 sm:py-4 text-xs text-[#7d8590] transition-colors hover:border-[#58a6ff] hover:text-[#58a6ff] active:bg-[#161b22]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add {platformLabel} iCal URL
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* How it works (only shown when not both connected) */}
      {links.length < 2 && (
        <div className="rounded-lg border border-[#21262d] bg-[#161b22] p-3 sm:p-4 text-xs text-[#7d8590] space-y-2">
          <p className="font-medium text-[#c9d1d9]">How it works</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Add your Airbnb and Booking.com iCal URLs above</li>
            <li>Click <strong className="text-[#c9d1d9]">Test Connection</strong> to verify each link</li>
            <li>We fetch both every 10 minutes to detect new bookings</li>
            <li>We generate enhanced feeds with your cleaning buffer days</li>
            <li>Copy the <strong className="text-[#c9d1d9]">Import URL</strong> and paste into each platform</li>
          </ol>
        </div>
      )}

      {/* ── Calendar View ── */}
      {hasLinks && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#7d8590]">Calendar</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCalOffset((o) => o - 3)} className="rounded p-1 text-[#7d8590] hover:bg-[#161b22] hover:text-[#f0f6fc]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              </button>
              {calOffset !== 0 && (
                <button onClick={() => setCalOffset(0)} className="rounded px-2 py-0.5 text-[11px] text-[#58a6ff] hover:bg-[#161b22]">Today</button>
              )}
              <button onClick={() => setCalOffset((o) => o + 3)} className="rounded p-1 text-[#7d8590] hover:bg-[#161b22] hover:text-[#f0f6fc]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[11px] text-[#7d8590]">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#FF5A5F]/60" /> Airbnb</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#003580]/80" /> Booking</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "repeating-linear-gradient(45deg, #d29922 0, #d29922 2px, transparent 2px, transparent 4px)", opacity: 0.7 }} /> Buffer (cleaning)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm border border-[#58a6ff]" /> Today</span>
          </div>

          {/* Month grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {calMonths.map((m) => (
              <div key={`${m.year}-${m.month}`} className="rounded-lg border border-[#21262d] bg-[#0d1117] p-2.5">
                <p className="text-xs font-semibold text-[#c9d1d9] mb-2 text-center">{m.label}</p>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-px mb-1">
                  {DAY_NAMES.map((d) => (
                    <div key={d} className="text-center text-[9px] text-[#7d8590] py-0.5">{d}</div>
                  ))}
                </div>
                {/* Days */}
                <div className="grid grid-cols-7 gap-px">
                  {m.days.map((day, idx) => {
                    const isBooked = day.airbnb || day.booking;
                    const isBoth = day.airbnb && day.booking;
                    let bgStyle: React.CSSProperties = {};
                    let textCls = day.isCurrentMonth ? "text-[#c9d1d9]" : "text-[#484f58]";

                    if (day.bufferDay && !isBooked) {
                      bgStyle = { background: "repeating-linear-gradient(45deg, rgba(210,153,34,0.25) 0, rgba(210,153,34,0.25) 2px, transparent 2px, transparent 4px)" };
                      textCls = day.isCurrentMonth ? "text-[#d29922]" : "text-[#7d6520]";
                    } else if (isBoth) {
                      bgStyle = { background: "linear-gradient(135deg, rgba(255,90,95,0.5) 50%, rgba(0,53,128,0.7) 50%)" };
                      textCls = "text-white";
                    } else if (day.airbnb) {
                      bgStyle = { background: "rgba(255,90,95,0.45)" };
                      textCls = "text-white";
                    } else if (day.booking) {
                      bgStyle = { background: "rgba(0,53,128,0.65)" };
                      textCls = "text-white";
                    }

                    return (
                      <div
                        key={idx}
                        className={`relative flex items-center justify-center rounded-sm h-7 sm:h-6 text-[11px] sm:text-[10px] ${textCls} ${day.isToday ? "ring-1 ring-[#58a6ff]" : ""}`}
                        style={bgStyle}
                        title={
                          day.airbnb && day.booking ? `${day.dateStr} — Airbnb + Booking`
                          : day.airbnb ? `${day.dateStr} — Airbnb`
                          : day.booking ? `${day.dateStr} — Booking`
                          : day.bufferDay ? `${day.dateStr} — Buffer (cleaning)`
                          : day.dateStr
                        }
                      >
                        {day.date.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Events List ── */}
      {futureEvents.length > 0 && (
        <div>
          <span className="text-xs font-medium text-[#7d8590] block mb-2">
            Tracked Events ({futureEvents.length})
          </span>
          <div className="rounded-lg border border-[#21262d] bg-[#0d1117] overflow-hidden">
            <div className="max-h-[200px] overflow-y-auto">
              {futureEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-2 sm:gap-3 border-b border-[#21262d] px-3 sm:px-4 py-2 last:border-b-0">
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${event.platform === "booking" ? "bg-[#003580]/30 text-[#79c0ff]" : "bg-[#FF5A5F]/15 text-[#f78166]"}`}>
                    {event.platform === "booking" ? "B" : "A"}
                  </span>
                  <span className="text-xs text-[#c9d1d9] truncate flex-1">{event.summary || "Blocked"}</span>
                  <span className="text-[11px] text-[#7d8590] shrink-0">{event.startDate} → {event.endDate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Sync Logs ── */}
      {logs.length > 0 && (
        <div>
          <span className="text-xs font-medium text-[#7d8590] block mb-2">Sync Log</span>
          <div className="rounded-lg border border-[#21262d] bg-[#0d1117] overflow-hidden">
            <div className="max-h-[180px] overflow-y-auto font-mono">
              {logs.map((log) => (
                <div key={log.id} className={`flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-2 border-b border-[#21262d] px-3 py-1.5 last:border-b-0 text-[11px] ${log.level === "error" ? "text-[#f85149]" : log.level === "success" ? "text-[#3fb950]" : log.level === "warn" ? "text-[#d29922]" : "text-[#7d8590]"}`}>
                  <span className="shrink-0 text-[#7d8590]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
