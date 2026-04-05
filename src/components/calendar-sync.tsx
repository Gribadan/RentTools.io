"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CalendarLink, CalendarEvent, SyncLogEntry } from "@/lib/types";

interface CalendarSyncProps {
  propertyId: number;
  propertyName: string;
}

export function CalendarSync({ propertyId, propertyName }: CalendarSyncProps) {
  const [links, setLinks] = useState<CalendarLink[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null); // platform
  const [urlInput, setUrlInput] = useState("");
  const [bufferBefore, setBufferBefore] = useState(1);
  const [bufferAfter, setBufferAfter] = useState(1);

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

  const handleSaveLink = async (platform: string) => {
    if (!urlInput.trim()) return;
    await fetch("/api/calendar/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        platform,
        icalExportUrl: urlInput.trim(),
        bufferBefore,
        bufferAfter,
      }),
    });
    setEditingLink(null);
    setUrlInput("");
    setBufDefaults();
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

  const setBufDefaults = () => {
    setBufferBefore(1);
    setBufferAfter(1);
  };

  const startEdit = (platform: string) => {
    const existing = links.find((l) => l.platform === platform);
    setEditingLink(platform);
    setUrlInput(existing?.icalExportUrl || "");
    setBufferBefore(existing?.bufferBefore ?? 1);
    setBufferAfter(existing?.bufferAfter ?? 1);
  };

  const feedUrl = (forPlatform: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/calendar/feed/${propertyId}?for=${forPlatform}`;
  };

  const today = new Date().toISOString().substring(0, 10);
  const futureEvents = events.filter((e) => e.endDate >= today);

  const airbnbLink = links.find((l) => l.platform === "airbnb");
  const bookingLink = links.find((l) => l.platform === "booking");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#f0f6fc]">Calendar Sync</h2>
          <p className="text-xs text-[#7d8590] mt-0.5">
            Sync Airbnb & Booking calendars with buffer days for cleaning
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing}
          className="h-8 rounded-md bg-[#238636] px-4 text-xs font-medium text-white hover:bg-[#2ea043] disabled:opacity-50"
        >
          {syncing ? (
            <span className="flex items-center gap-1.5">
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83" />
              </svg>
              Syncing...
            </span>
          ) : (
            "Sync Now"
          )}
        </Button>
      </div>

      {/* Platform Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["airbnb", "booking"] as const).map((platform) => {
          const link = platform === "airbnb" ? airbnbLink : bookingLink;
          const otherPlatform = platform === "airbnb" ? "booking" : "airbnb";
          const isEditing = editingLink === platform;
          const color = platform === "airbnb" ? "#FF5A5F" : "#003580";
          const bgColor = platform === "airbnb" ? "rgba(255,90,95,0.08)" : "rgba(0,53,128,0.12)";
          const textColor = platform === "airbnb" ? "#f78166" : "#79c0ff";

          return (
            <div
              key={platform}
              className="rounded-lg border border-[#21262d] bg-[#0d1117] p-4"
            >
              {/* Platform header */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-semibold capitalize" style={{ color: textColor }}>
                  {platform}
                </span>
                {link && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-[#3fb950]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950]" />
                    Connected
                  </span>
                )}
              </div>

              {/* Export URL (what we fetch) */}
              {link && !isEditing ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-[#7d8590] block mb-1">iCal Export URL</span>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-[#161b22] px-2 py-1.5 text-xs text-[#9198a1] border border-[#30363d]">
                        {link.icalExportUrl}
                      </code>
                      <button
                        onClick={() => startEdit(platform)}
                        className="shrink-0 rounded p-1.5 text-[#7d8590] hover:bg-[#161b22] hover:text-[#f0f6fc]"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="shrink-0 rounded p-1.5 text-[#7d8590] hover:bg-[#161b22] hover:text-[#f85149]"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Buffer days */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#7d8590]">Buffer before:</span>
                      <select
                        value={link.bufferBefore}
                        onChange={(e) => handleUpdateBuffer(link.id, "bufferBefore", Number(e.target.value))}
                        className="h-7 rounded border border-[#30363d] bg-[#161b22] px-2 text-xs text-[#f0f6fc] outline-none"
                      >
                        {[0, 1, 2, 3].map((n) => (
                          <option key={n} value={n}>{n} day{n !== 1 ? "s" : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#7d8590]">After:</span>
                      <select
                        value={link.bufferAfter}
                        onChange={(e) => handleUpdateBuffer(link.id, "bufferAfter", Number(e.target.value))}
                        className="h-7 rounded border border-[#30363d] bg-[#161b22] px-2 text-xs text-[#f0f6fc] outline-none"
                      >
                        {[0, 1, 2, 3].map((n) => (
                          <option key={n} value={n}>{n} day{n !== 1 ? "s" : ""}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="text-xs text-[#7d8590]">
                    {link.lastFetchedAt && (
                      <span>Last synced: {new Date(link.lastFetchedAt).toLocaleString()}</span>
                    )}
                    {link.lastError && (
                      <span className="block text-[#f85149] mt-0.5">{link.lastError}</span>
                    )}
                  </div>

                  {/* Feed URL for the OTHER platform */}
                  {links.length >= 2 && (
                    <div className="rounded-md p-2.5" style={{ backgroundColor: bgColor }}>
                      <span className="text-xs font-medium block mb-1" style={{ color: textColor }}>
                        Import URL for {platform}
                      </span>
                      <p className="text-xs text-[#7d8590] mb-1.5">
                        Paste this into {platform === "airbnb" ? "Airbnb" : "Booking.com"}&apos;s calendar import:
                      </p>
                      <div className="flex items-center gap-1.5">
                        <code className="flex-1 truncate rounded bg-[#0d1117] px-2 py-1.5 text-xs text-[#c9d1d9] border border-[#30363d]">
                          {feedUrl(platform)}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(feedUrl(platform))}
                          className="shrink-0 rounded bg-[#21262d] px-2.5 py-1.5 text-xs text-[#c9d1d9] hover:bg-[#30363d]"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isEditing ? (
                /* Edit / Add form */
                <div className="space-y-2.5">
                  <div>
                    <span className="text-xs text-[#7d8590] block mb-1">iCal Export URL</span>
                    <input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={`https://${platform === "airbnb" ? "www.airbnb.com/calendar/ical/..." : "admin.booking.com/hotel/.../ical..."}`}
                      className="h-8 w-full rounded border border-[#30363d] bg-[#0d1117] px-2.5 text-xs text-[#f0f6fc] placeholder-[#7d8590] outline-none focus:border-[#58a6ff]"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#7d8590]">Buffer before:</span>
                      <select
                        value={bufferBefore}
                        onChange={(e) => setBufferBefore(Number(e.target.value))}
                        className="h-7 rounded border border-[#30363d] bg-[#161b22] px-2 text-xs text-[#f0f6fc] outline-none"
                      >
                        {[0, 1, 2, 3].map((n) => (
                          <option key={n} value={n}>{n} day{n !== 1 ? "s" : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#7d8590]">After:</span>
                      <select
                        value={bufferAfter}
                        onChange={(e) => setBufferAfter(Number(e.target.value))}
                        className="h-7 rounded border border-[#30363d] bg-[#161b22] px-2 text-xs text-[#f0f6fc] outline-none"
                      >
                        {[0, 1, 2, 3].map((n) => (
                          <option key={n} value={n}>{n} day{n !== 1 ? "s" : ""}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSaveLink(platform)}
                      className="h-7 rounded bg-[#238636] px-3 text-xs text-white hover:bg-[#2ea043]"
                    >
                      Save
                    </Button>
                    <button
                      onClick={() => { setEditingLink(null); setUrlInput(""); setBufDefaults(); }}
                      className="h-7 rounded px-3 text-xs text-[#9198a1] hover:text-[#f0f6fc]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Not configured — show add button */
                <button
                  onClick={() => startEdit(platform)}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#30363d] py-4 text-xs text-[#7d8590] transition-colors hover:border-[#58a6ff] hover:text-[#58a6ff]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add {platform === "airbnb" ? "Airbnb" : "Booking"} iCal URL
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* How it works */}
      {links.length < 2 && (
        <div className="rounded-lg border border-[#21262d] bg-[#161b22] p-4 text-xs text-[#7d8590] space-y-2">
          <p className="font-medium text-[#c9d1d9]">How it works</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Add your Airbnb and Booking.com iCal export URLs above</li>
            <li>We fetch both every 10 minutes to detect new bookings</li>
            <li>We generate enhanced iCal feeds with cleaning buffer days</li>
            <li>Copy the &quot;Import URL&quot; and paste it into each platform&apos;s calendar settings</li>
            <li>Both platforms will always stay in sync with buffer days included</li>
          </ol>
        </div>
      )}

      {/* Synced Events */}
      {futureEvents.length > 0 && (
        <div>
          <span className="text-xs font-medium text-[#7d8590] block mb-2">
            Tracked Events ({futureEvents.length})
          </span>
          <div className="rounded-lg border border-[#21262d] bg-[#0d1117] overflow-hidden">
            <div className="max-h-[240px] overflow-y-auto">
              {futureEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 border-b border-[#21262d] px-4 py-2 last:border-b-0"
                >
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-bold ${
                      event.platform === "booking"
                        ? "bg-[#003580]/30 text-[#79c0ff]"
                        : "bg-[#FF5A5F]/15 text-[#f78166]"
                    }`}
                  >
                    {event.platform === "booking" ? "B" : "A"}
                  </span>
                  <span className="text-xs text-[#c9d1d9] truncate flex-1">
                    {event.summary || "Blocked"}
                  </span>
                  <span className="text-xs text-[#7d8590] shrink-0">
                    {event.startDate} → {event.endDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sync Logs */}
      {logs.length > 0 && (
        <div>
          <span className="text-xs font-medium text-[#7d8590] block mb-2">
            Sync Log
          </span>
          <div className="rounded-lg border border-[#21262d] bg-[#0d1117] overflow-hidden">
            <div className="max-h-[200px] overflow-y-auto font-mono">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 border-b border-[#21262d] px-3 py-1.5 last:border-b-0 text-xs ${
                    log.level === "error"
                      ? "text-[#f85149]"
                      : log.level === "success"
                        ? "text-[#3fb950]"
                        : log.level === "warn"
                          ? "text-[#d29922]"
                          : "text-[#7d8590]"
                  }`}
                >
                  <span className="shrink-0 text-[#7d8590]">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
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
