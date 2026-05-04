"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { OnboardingTooltip } from "@/components/onboarding-tooltip";
import { CleanerAssignmentSection } from "@/components/cleaner-assignment-section";
import { MessageTemplatesPanel } from "@/components/message-templates-panel";
import { PropertyManagersPanel } from "@/components/property-managers-panel";
import { useI18n } from "@/lib/i18n/context";
import type { CalendarLink, SyncLogEntry } from "@/lib/types";

interface TestResult {
  success: boolean;
  error?: string;
  futureEvents?: number;
  pastEvents?: number;
  totalEvents?: number;
  events?: { startDate: string; endDate: string; summary: string }[];
}

interface SyncSettingsProps {
  propertyId: number;
  propertyName: string;
  minNights: number;
  checkInTime: string;
  checkOutTime: string;
  bookingWindow: number;
  ownerUserId: number;
  onUpdateProperty: (id: number, data: { minNights?: number; checkInTime?: string; checkOutTime?: string; bookingWindow?: number }) => void;
}

export function SyncSettings({ propertyId, propertyName, minNights, checkInTime, checkOutTime, bookingWindow, ownerUserId, onUpdateProperty }: SyncSettingsProps) {
  const { t, locale } = useI18n();
  const [links, setLinks] = useState<CalendarLink[]>([]);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  // Per-platform input states
  const [airbnbUrl, setAirbnbUrl] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);

  // Public feed token (null = public feed; non-null = ?token=… required)
  const [feedToken, setFeedToken] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  const fetchData = async () => {
    const [linksRes, syncRes, tokenRes] = await Promise.all([
      fetch(`/api/calendar/links?propertyId=${propertyId}`),
      fetch(`/api/calendar/sync?propertyId=${propertyId}&limit=50`),
      fetch(`/api/properties/${propertyId}/rotate-feed-token`),
    ]);
    if (linksRes.ok) {
      const data = await linksRes.json();
      setLinks(data);
      // Populate URL inputs from existing links
      const ab = data.find((l: CalendarLink) => l.platform === "airbnb");
      const bk = data.find((l: CalendarLink) => l.platform === "booking");
      if (ab) setAirbnbUrl(ab.icalExportUrl);
      if (bk) setBookingUrl(bk.icalExportUrl);
    }
    if (syncRes.ok) {
      const data = await syncRes.json();
      setLogs(data.logs || []);
    }
    if (tokenRes.ok) {
      const data = await tokenRes.json();
      setFeedToken(typeof data.feedToken === "string" ? data.feedToken : null);
    }
  };

  const handleRotateToken = async () => {
    setRotating(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/rotate-feed-token`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.feedToken === "string") setFeedToken(data.feedToken);
      }
    } finally {
      setRotating(false);
    }
  };

  const handleClearToken = async () => {
    setRotating(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/rotate-feed-token`, { method: "DELETE" });
      if (res.ok) setFeedToken(null);
    } finally {
      setRotating(false);
    }
  };

  const getLink = (platform: string) => links.find((l) => l.platform === platform);

  const handleSave = async (platform: string, url: string) => {
    if (!url.trim()) return;
    const link = getLink(platform);
    await fetch("/api/calendar/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        platform,
        icalExportUrl: url.trim(),
        bufferBefore: link?.bufferBefore ?? 0,
        bufferAfter: link?.bufferAfter ?? 0,
      }),
    });
    setEditingPlatform(null);
    await fetchData();
  };

  const handleDelete = async (platform: string) => {
    const link = getLink(platform);
    if (!link) return;
    await fetch(`/api/calendar/links/${link.id}`, { method: "DELETE" });
    if (platform === "airbnb") setAirbnbUrl("");
    else setBookingUrl("");
    await fetchData();
  };

  const handleTest = async (platform: string, url: string) => {
    if (!url.trim()) return;
    setTesting(platform);
    setTestResults((prev) => { const next = { ...prev }; delete next[platform]; return next; });
    try {
      const res = await fetch("/api/calendar/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const result = await res.json();
      setTestResults((prev) => ({ ...prev, [platform]: result }));
    } catch (err) {
      setTestResults((prev) => ({ ...prev, [platform]: { success: false, error: String(err) } }));
    } finally {
      setTesting(null);
    }
  };

  const handleUpdateBuffer = async (platform: string, field: "bufferBefore" | "bufferAfter", value: number) => {
    const link = getLink(platform);
    if (!link) return;
    await fetch(`/api/calendar/links/${link.id}`, {
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

  const feedUrl = (forPlatform: string) => {
    if (typeof window === "undefined") return "";
    const base = `${window.location.origin}/api/calendar/feed/${propertyId}/for-${forPlatform}.ics`;
    return feedToken ? `${base}?token=${feedToken}` : base;
  };

  const copyUrl = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const platforms = [
    { key: "airbnb", label: "Airbnb", color: "#ff385c", url: airbnbUrl, setUrl: setAirbnbUrl },
    { key: "booking", label: "Booking.com", color: "#003580", url: bookingUrl, setUrl: setBookingUrl },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#e8e8ec]">{t("sync.title")}</h1>
          <p className="mt-0.5 text-sm text-[#a0a0a8]">{propertyName}</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1.5 rounded-md bg-[#ff385c] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e0294d] disabled:opacity-50"
        >
          <svg className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {syncing ? t("sync.syncing") : t("sync.syncNow")}
        </button>
      </div>

      {links.length === 0 && (
        <EmptyState
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          }
          title={t("empty.sync.title")}
          description={t("empty.sync.desc")}
        />
      )}

      {/* Platform Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map(({ key: platform, label, color, url, setUrl }) => {
          const link = getLink(platform);
          const isConnected = !!link;
          const isEditing = editingPlatform === platform || !isConnected;
          const result = testResults[platform];
          const otherPlatform = platform === "airbnb" ? "booking" : "airbnb";

          return (
            <div key={platform} className="rounded-lg border border-[#27272b] bg-[#18181b] p-4 space-y-4">
              {/* Platform header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm font-semibold text-[#e8e8ec]">{label}</span>
                </div>
                {isConnected && (
                  <span className="flex items-center gap-1 text-xs text-[#34d399]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                    {t("sync.connected")}
                  </span>
                )}
              </div>

              {/* Step 1: Export URL from platform */}
              <div className="space-y-2">
                {platform === "airbnb" && !isConnected ? (
                  <OnboardingTooltip id={`ical-url:${propertyId}`} text={t("tooltip.icalUrl")}>
                    <label className="text-xs text-[#a0a0a8]">
                      {t("sync.icalLabel")} {label}
                    </label>
                  </OnboardingTooltip>
                ) : (
                  <label className="text-xs text-[#a0a0a8]">
                    {t("sync.icalLabel")} {label}
                  </label>
                )}
                <div className="flex gap-1.5">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t("sync.pastePlaceholder", { platform: label })}
                    className="h-8 flex-1 rounded-md border border-[#333338] bg-[#111113] px-2.5 text-xs text-[#e8e8ec] placeholder-[#71717a] outline-none focus:border-[#e8e8ec]"
                    disabled={isConnected && !isEditing}
                  />
                  {isConnected && !isEditing ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingPlatform(platform)}
                        className="rounded-md bg-[#27272b] px-2 py-1 text-xs text-[#d4d4d8] hover:bg-[#333338]"
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(platform)}
                        className="rounded-md px-2 py-1 text-xs text-[#ef4444] hover:bg-[#ef4444]/10"
                      >
                        {t("common.remove")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleTest(platform, url)}
                        disabled={!url.trim() || testing === platform}
                        className="rounded-md bg-[#27272b] px-2.5 py-1 text-xs text-[#d4d4d8] hover:bg-[#333338] disabled:opacity-40"
                      >
                        {testing === platform ? "..." : t("common.test")}
                      </button>
                      <button
                        onClick={() => handleSave(platform, url)}
                        disabled={!url.trim()}
                        className="rounded-md bg-[#ff385c] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#e0294d] disabled:opacity-40"
                      >
                        {t("common.save")}
                      </button>
                    </div>
                  )}
                </div>

                {/* Test result */}
                {result && (
                  <div className={`rounded-md px-3 py-2 text-xs ${result.success ? "bg-[#34d399]/10 text-[#34d399]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                    {result.success ? (
                      <span>{result.futureEvents} upcoming · {result.totalEvents} total events</span>
                    ) : (
                      <span>{result.error}</span>
                    )}
                  </div>
                )}

                {/* Last sync info */}
                {link?.lastFetchedAt && (
                  <p className="text-xs text-[#71717a]">
                    {t("sync.lastSynced")} {new Date(link.lastFetchedAt).toLocaleString(locale === "ru" ? "ru-RU" : "en-GB")}
                  </p>
                )}
              </div>

              {/* Step 2: Import URL for platform */}
              {isConnected && (
                <div className="space-y-1.5 border-t border-[#27272b] pt-3">
                  <label className="text-xs text-[#a0a0a8]">
                    {t("sync.importLabel")} {label}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <code className="flex-1 truncate rounded-md bg-[#111113] border border-[#333338] px-2.5 py-1.5 text-xs text-[#d4d4d8]">
                      {feedUrl(platform)}
                    </code>
                    <button
                      onClick={() => copyUrl(feedUrl(platform), `feed-${platform}`)}
                      className="shrink-0 rounded-md bg-[#27272b] px-2.5 py-1.5 text-xs text-[#d4d4d8] hover:bg-[#333338]"
                    >
                      {copied === `feed-${platform}` ? t("common.copied") : t("common.copy")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feed Token (private feed URL) */}
      {links.length > 0 && (
        <div className="rounded-lg border border-[#27272b] bg-[#18181b] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#e8e8ec]">Feed access token</h2>
              <p className="mt-0.5 text-xs text-[#a0a0a8]">
                {feedToken
                  ? "Your feed URLs include a private token. Rotating invalidates the old URL — re-paste the new one into Airbnb / Booking."
                  : "Your feed URLs are public. Add a token to make them unguessable; old screenshots / leaks become useless after a rotation."}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {feedToken && (
                <button
                  onClick={handleClearToken}
                  disabled={rotating}
                  className="rounded-md px-2.5 py-1 text-xs text-[#a0a0a8] hover:text-[#e8e8ec] disabled:opacity-40"
                >
                  Make public
                </button>
              )}
              <button
                onClick={handleRotateToken}
                disabled={rotating}
                className="rounded-md bg-[#ff385c] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#e0294d] disabled:opacity-40"
              >
                {rotating ? "..." : feedToken ? "Rotate" : "Generate token"}
              </button>
            </div>
          </div>
          {feedToken && (
            <code className="block truncate rounded-md border border-[#333338] bg-[#111113] px-2.5 py-1.5 text-xs text-[#d4d4d8]">
              ?token={feedToken}
            </code>
          )}
        </div>
      )}

      {/* Buffer Settings */}
      {links.length > 0 && (
        <div className="rounded-lg border border-[#27272b] bg-[#18181b] p-4 space-y-4">
          <h2 className="text-sm font-semibold text-[#e8e8ec]">{t("sync.bufferDays")}</h2>
          <p className="text-xs text-[#a0a0a8]">
            {t("sync.bufferDesc")}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {platforms.map(({ key: platform, label, color }) => {
              const link = getLink(platform);
              if (!link) return null;
              return (
                <div key={platform} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs font-medium text-[#e8e8ec]">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#71717a]">{t("sync.before")}</span>
                      <div className="relative">
                        <select
                          value={link.bufferBefore}
                          onChange={(e) => handleUpdateBuffer(platform, "bufferBefore", Number(e.target.value))}
                          className="h-7 appearance-none rounded-md border border-[#333338] bg-[#111113] pl-2.5 pr-7 text-xs text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
                        >
                          {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n} {locale === "ru" ? "дн." : (n !== 1 ? "days" : "day")}</option>)}
                        </select>
                        <svg className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71717a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#71717a]">{t("sync.after")}</span>
                      <div className="relative">
                        <select
                          value={link.bufferAfter}
                          onChange={(e) => handleUpdateBuffer(platform, "bufferAfter", Number(e.target.value))}
                          className="h-7 appearance-none rounded-md border border-[#333338] bg-[#111113] pl-2.5 pr-7 text-xs text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
                        >
                          {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n} {locale === "ru" ? "дн." : (n !== 1 ? "days" : "day")}</option>)}
                        </select>
                        <svg className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71717a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Minimum Nights */}
      <div className="rounded-lg border border-[#27272b] bg-[#18181b] p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#e8e8ec]">{t("sync.minStay")}</h2>
        <p className="text-xs text-[#a0a0a8]">
          {t("sync.minStayDesc")}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#a0a0a8]">{t("sync.minNights")}</span>
          <div className="relative">
            <select
              value={minNights}
              onChange={(e) => onUpdateProperty(propertyId, { minNights: Number(e.target.value) })}
              className="h-8 appearance-none rounded-md border border-[#333338] bg-[#111113] pl-3 pr-8 text-sm text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
            >
              {[1, 2, 3, 4, 5, 7, 10, 14].map((n) => <option key={n} value={n}>{n} {locale === "ru" ? "ноч." : (n !== 1 ? "nights" : "night")}</option>)}
            </select>
            <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </div>
        </div>
      </div>

      {/* Check-in / Check-out times */}
      <div className="rounded-lg border border-[#27272b] bg-[#18181b] p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#e8e8ec]">{t("sync.checkInOutTimes")}</h2>
        <p className="text-xs text-[#a0a0a8]">{t("sync.checkInOutDesc")}</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#a0a0a8]">{t("sync.checkInTime")}</span>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => onUpdateProperty(propertyId, { checkInTime: e.target.value })}
              className="h-8 rounded-md border border-[#333338] bg-[#111113] px-3 text-sm text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#a0a0a8]">{t("sync.checkOutTime")}</span>
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => onUpdateProperty(propertyId, { checkOutTime: e.target.value })}
              className="h-8 rounded-md border border-[#333338] bg-[#111113] px-3 text-sm text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
            />
          </div>
        </div>
      </div>

      {/* Booking Window */}
      <div className="rounded-lg border border-[#27272b] bg-[#18181b] p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#e8e8ec]">{t("sync.bookingWindow")}</h2>
        <p className="text-xs text-[#a0a0a8]">{t("sync.bookingWindowDesc")}</p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={bookingWindow}
              onChange={(e) => onUpdateProperty(propertyId, { bookingWindow: Number(e.target.value) })}
              className="h-8 appearance-none rounded-md border border-[#333338] bg-[#111113] pl-3 pr-8 text-sm text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
            >
              {[90, 180, 270, 365, 548, 730].map((n) => (
                <option key={n} value={n}>{n} {t("sync.bookingWindowDays")} ({Math.round(n / 30)} {locale === "ru" ? "мес." : "mo"})</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </div>
        </div>
      </div>

      {/* Property Managers */}
      <PropertyManagersPanel propertyId={propertyId} ownerUserId={ownerUserId} />

      {/* Sync Log */}
      {logs.length > 0 && (
        <div className="rounded-lg border border-[#27272b] bg-[#18181b]">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-[#a0a0a8] hover:text-[#e8e8ec]"
          >
            <span>Sync Log ({logs.length})</span>
            <svg className={`h-4 w-4 transition-transform ${showLogs ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {showLogs && (
            <div className="border-t border-[#27272b] max-h-[200px] overflow-y-auto p-3 font-mono text-xs leading-relaxed">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="shrink-0 text-[#71717a]">
                    {new Date(log.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className={
                    log.level === "error" ? "text-[#ef4444]"
                    : log.level === "success" ? "text-[#34d399]"
                    : log.level === "warn" ? "text-[#fbbf24]"
                    : "text-[#a0a0a8]"
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <CleanerAssignmentSection propertyId={propertyId} />
      <MessageTemplatesPanel propertyId={propertyId} />
    </div>
  );
}
