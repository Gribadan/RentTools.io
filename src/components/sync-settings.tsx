"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { OnboardingTooltip } from "@/components/onboarding-tooltip";
import { MessageTemplatesPanel } from "@/components/message-templates-panel";
import { PropertyManagersPanel } from "@/components/property-managers-panel";
import { GuestFormBuilder } from "@/components/guest-form-builder";
import { PropertySwitcher } from "@/components/property-switcher";
import { useI18n } from "@/lib/i18n/context";
import type { CalendarLink, Property, SyncLogEntry } from "@/lib/types";

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
  /** All properties the user can access — drives the
   *  PropertySwitcher pills above the property settings. Not required;
   *  the switcher hides itself when only one property exists. */
  properties?: Property[];
  minNights: number;
  checkInTime: string;
  checkOutTime: string;
  bookingWindow: number;
  ownerUserId: number;
  onUpdateProperty: (id: number, data: { name?: string; minNights?: number; checkInTime?: string; checkOutTime?: string; bookingWindow?: number }) => void;
  onDeleteProperty: (id: number) => void | Promise<void>;
}

export function SyncSettings({ propertyId, propertyName, properties, minNights, checkInTime, checkOutTime, bookingWindow, ownerUserId, onUpdateProperty, onDeleteProperty }: SyncSettingsProps) {
  const { t, locale } = useI18n();
  const [links, setLinks] = useState<CalendarLink[]>([]);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  // Rename + delete are scoped here so the entire property settings
  // page doesn't have to remount when the user toggles edit mode.
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Per-platform input states
  const [airbnbUrl, setAirbnbUrl] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);

  // Public feed token (null = public feed; non-null = ?token=… required)
  const [feedToken, setFeedToken] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);

  // Mobile-only collapse state for the always-on configuration cards
  // (buffer days, min nights, check-in/out times, booking window). They
  // dominate the scroll on a 375px screen but get set once and forgotten.
  // SSR renders them open; on mount we collapse them on <sm only.
  const [advancedOpen, setAdvancedOpen] = useState({
    buffer: true,
    minNights: true,
    times: true,
    window: true,
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 639px)").matches) {
      setAdvancedOpen({ buffer: false, minNights: false, times: false, window: false });
    }
  }, []);
  const toggleAdvanced = (key: keyof typeof advancedOpen) =>
    setAdvancedOpen((s) => ({ ...s, [key]: !s[key] }));

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
    <div className="cls-isolate mx-auto max-w-3xl space-y-6">
      {/* Property switcher — top-of-page pill row so the user can
          jump between properties without using the top-bar dropdown.
          Hidden when only one property exists (PropertySwitcher
          early-returns) so the page stays clean. */}
      {properties && properties.length > 1 && (
        <PropertySwitcher
          properties={properties}
          selectedPropertyId={propertyId}
          view="sync"
          showAllOption={false}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-[var(--ink)]">{t("sync.title")}</h1>
          {renaming ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const next = renameValue.trim();
                if (next && next !== propertyName) {
                  onUpdateProperty(propertyId, { name: next });
                }
                setRenaming(false);
              }}
              className="mt-1 flex items-center gap-2"
            >
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") { setRenaming(false); setRenameValue(propertyName); } }}
                className="h-8 flex-1 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--m-accent)]"
              />
              <button type="submit" className="rounded-md bg-[var(--m-accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--m-accent-2)]">
                {locale === "ru" ? "Сохранить" : "Save"}
              </button>
              <button type="button" onClick={() => { setRenaming(false); setRenameValue(propertyName); }} className="rounded-md px-3 py-1.5 text-xs text-[var(--ink-3)] hover:text-[var(--ink)]">
                {locale === "ru" ? "Отмена" : "Cancel"}
              </button>
            </form>
          ) : (
            <div className="mt-0.5 flex items-center gap-1.5">
              <p className="text-sm text-[var(--ink-3)] truncate">{propertyName}</p>
              <button
                onClick={() => { setRenameValue(propertyName); setRenaming(true); }}
                title={locale === "ru" ? "Переименовать" : "Rename"}
                aria-label={locale === "ru" ? "Переименовать" : "Rename"}
                className="rounded p-0.5 text-[var(--ink-4)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)] transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1.5 rounded-md bg-[var(--m-accent)] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-50"
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
            <div key={platform} className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-4 space-y-4">
              {/* Platform header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm font-semibold text-[var(--ink)]">{label}</span>
                </div>
                {isConnected && (
                  <span className="flex items-center gap-1 text-xs text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {t("sync.connected")}
                  </span>
                )}
              </div>

              {/* Step 1: Export URL from platform */}
              <div className="space-y-2">
                {platform === "airbnb" && !isConnected ? (
                  <OnboardingTooltip id={`ical-url:${propertyId}`} text={t("tooltip.icalUrl")}>
                    <label className="text-xs text-[var(--ink-3)]">
                      {t("sync.icalLabel")} {label}
                    </label>
                  </OnboardingTooltip>
                ) : (
                  <label className="text-xs text-[var(--ink-3)]">
                    {t("sync.icalLabel")} {label}
                  </label>
                )}
                <div className="flex gap-1.5">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t("sync.pastePlaceholder", { platform: label })}
                    className="h-8 flex-1 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2.5 text-xs text-[var(--ink)] placeholder-[var(--ink-4)] outline-none focus:border-[var(--ink)]"
                    disabled={isConnected && !isEditing}
                  />
                  {isConnected && !isEditing ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingPlatform(platform)}
                        className="rounded-md bg-[var(--line-2)] px-2 py-1 text-xs text-[var(--ink-2)] hover:bg-[var(--line-2)]"
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(platform)}
                        className="rounded-md px-2 py-1 text-xs text-rose-500 hover:bg-rose-500/10"
                      >
                        {t("common.remove")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleTest(platform, url)}
                        disabled={!url.trim() || testing === platform}
                        className="rounded-md bg-[var(--line-2)] px-2.5 py-1 text-xs text-[var(--ink-2)] hover:bg-[var(--line-2)] disabled:opacity-40"
                      >
                        {testing === platform ? "..." : t("common.test")}
                      </button>
                      <button
                        onClick={() => handleSave(platform, url)}
                        disabled={!url.trim()}
                        className="rounded-md bg-[var(--m-accent)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--m-accent-2)] disabled:opacity-40"
                      >
                        {t("common.save")}
                      </button>
                    </div>
                  )}
                </div>

                {/* Test result */}
                {result && (
                  <div className={`rounded-md px-3 py-2 text-xs ${result.success ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                    {result.success ? (
                      <span>{result.futureEvents} upcoming · {result.totalEvents} total events</span>
                    ) : (
                      <span>{result.error}</span>
                    )}
                  </div>
                )}

                {/* Last sync info */}
                {link?.lastFetchedAt && (
                  <p className="text-xs text-[var(--ink-4)]">
                    {t("sync.lastSynced")} {new Date(link.lastFetchedAt).toLocaleString(locale === "ru" ? "ru-RU" : "en-GB")}
                  </p>
                )}
              </div>

              {/* Step 2: Import URL for platform */}
              {isConnected && (
                <div className="space-y-1.5 border-t border-[var(--line)] pt-3">
                  <label className="text-xs text-[var(--ink-3)]">
                    {t("sync.importLabel")} {label}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <code className="flex-1 truncate rounded-md bg-[var(--bg)] border border-[var(--line-2)] px-2.5 py-1.5 text-xs text-[var(--ink-2)]">
                      {feedUrl(platform)}
                    </code>
                    <button
                      onClick={() => copyUrl(feedUrl(platform), `feed-${platform}`)}
                      className="shrink-0 rounded-md bg-[var(--line-2)] px-2.5 py-1.5 text-xs text-[var(--ink-2)] hover:bg-[var(--line-2)]"
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

      {/* Buffer Settings */}
      {links.length > 0 && (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
          <button
            type="button"
            onClick={() => toggleAdvanced("buffer")}
            aria-expanded={advancedOpen.buffer}
            className="flex w-full items-center justify-between p-4 text-left sm:cursor-default"
          >
            <h2 className="text-sm font-semibold text-[var(--ink)]">{t("sync.bufferDays")}</h2>
            <svg className={`h-4 w-4 shrink-0 text-[var(--ink-4)] transition-transform sm:hidden ${advancedOpen.buffer ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <div className={`px-4 pb-4 space-y-4 sm:block ${advancedOpen.buffer ? "block" : "hidden"}`}>
          <p className="text-xs text-[var(--ink-3)]">
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
                    <span className="text-xs font-medium text-[var(--ink)]">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[var(--ink-4)]">{t("sync.before")}</span>
                      <div className="relative">
                        <select
                          value={link.bufferBefore}
                          onChange={(e) => handleUpdateBuffer(platform, "bufferBefore", Number(e.target.value))}
                          className="h-7 appearance-none rounded-md border border-[var(--line-2)] bg-[var(--bg)] pl-2.5 pr-7 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                        >
                          {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n} {locale === "ru" ? "дн." : (n !== 1 ? "days" : "day")}</option>)}
                        </select>
                        <svg className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[var(--ink-4)]">{t("sync.after")}</span>
                      <div className="relative">
                        <select
                          value={link.bufferAfter}
                          onChange={(e) => handleUpdateBuffer(platform, "bufferAfter", Number(e.target.value))}
                          className="h-7 appearance-none rounded-md border border-[var(--line-2)] bg-[var(--bg)] pl-2.5 pr-7 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                        >
                          {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n} {locale === "ru" ? "дн." : (n !== 1 ? "days" : "day")}</option>)}
                        </select>
                        <svg className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {/* Minimum Nights */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
        <button
          type="button"
          onClick={() => toggleAdvanced("minNights")}
          aria-expanded={advancedOpen.minNights}
          className="flex w-full items-center justify-between p-4 text-left sm:cursor-default"
        >
          <h2 className="text-sm font-semibold text-[var(--ink)]">{t("sync.minStay")}</h2>
          <svg className={`h-4 w-4 shrink-0 text-[var(--ink-4)] transition-transform sm:hidden ${advancedOpen.minNights ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        <div className={`px-4 pb-4 space-y-3 sm:block ${advancedOpen.minNights ? "block" : "hidden"}`}>
          <p className="text-xs text-[var(--ink-3)]">
            {t("sync.minStayDesc")}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--ink-3)]">{t("sync.minNights")}</span>
            <div className="relative">
              <select
                value={minNights}
                onChange={(e) => onUpdateProperty(propertyId, { minNights: Number(e.target.value) })}
                className="h-8 appearance-none rounded-md border border-[var(--line-2)] bg-[var(--bg)] pl-3 pr-8 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
              >
                {[1, 2, 3, 4, 5, 7, 10, 14].map((n) => <option key={n} value={n}>{n} {locale === "ru" ? "ноч." : (n !== 1 ? "nights" : "night")}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in / Check-out times */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
        <button
          type="button"
          onClick={() => toggleAdvanced("times")}
          aria-expanded={advancedOpen.times}
          className="flex w-full items-center justify-between p-4 text-left sm:cursor-default"
        >
          <h2 className="text-sm font-semibold text-[var(--ink)]">{t("sync.checkInOutTimes")}</h2>
          <svg className={`h-4 w-4 shrink-0 text-[var(--ink-4)] transition-transform sm:hidden ${advancedOpen.times ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        <div className={`px-4 pb-4 space-y-3 sm:block ${advancedOpen.times ? "block" : "hidden"}`}>
          <p className="text-xs text-[var(--ink-3)]">{t("sync.checkInOutDesc")}</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--ink-3)]">{t("sync.checkInTime")}</span>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => onUpdateProperty(propertyId, { checkInTime: e.target.value })}
                className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--ink-3)]">{t("sync.checkOutTime")}</span>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => onUpdateProperty(propertyId, { checkOutTime: e.target.value })}
                className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Booking Window */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
        <button
          type="button"
          onClick={() => toggleAdvanced("window")}
          aria-expanded={advancedOpen.window}
          className="flex w-full items-center justify-between p-4 text-left sm:cursor-default"
        >
          <h2 className="text-sm font-semibold text-[var(--ink)]">{t("sync.bookingWindow")}</h2>
          <svg className={`h-4 w-4 shrink-0 text-[var(--ink-4)] transition-transform sm:hidden ${advancedOpen.window ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        <div className={`px-4 pb-4 space-y-3 sm:block ${advancedOpen.window ? "block" : "hidden"}`}>
          <p className="text-xs text-[var(--ink-3)]">{t("sync.bookingWindowDesc")}</p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={bookingWindow}
                onChange={(e) => onUpdateProperty(propertyId, { bookingWindow: Number(e.target.value) })}
                className="h-8 appearance-none rounded-md border border-[var(--line-2)] bg-[var(--bg)] pl-3 pr-8 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
              >
                {[90, 180, 270, 365, 548, 730].map((n) => (
                  <option key={n} value={n}>{n} {t("sync.bookingWindowDays")} ({Math.round(n / 30)} {locale === "ru" ? "мес." : "mo"})</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Property Managers */}
      <PropertyManagersPanel propertyId={propertyId} ownerUserId={ownerUserId} />

      {/* Sync Log */}
      {logs.length > 0 && (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-[var(--ink-3)] hover:text-[var(--ink)]"
          >
            <span>Sync Log ({logs.length})</span>
            <svg className={`h-4 w-4 transition-transform ${showLogs ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {showLogs && (
            <div className="border-t border-[var(--line)] max-h-[200px] overflow-y-auto p-3 font-mono text-xs leading-relaxed">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="shrink-0 text-[var(--ink-4)]">
                    {new Date(log.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className={
                    log.level === "error" ? "text-rose-500"
                    : log.level === "success" ? "text-emerald-500"
                    : log.level === "warn" ? "text-amber-400"
                    : "text-[var(--ink-3)]"
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RT-25.10 tick 2 — CleanerAssignmentSection moved to the
          PropertyCleaningView sidebar. The cleaning tab is the sole
          assignment UI now. */}
      <MessageTemplatesPanel propertyId={propertyId} />
      <GuestFormBuilder propertyId={propertyId} />

      {/* Feed access token (RT-25.4) — relocated to the bottom of the
          page. The card explains what the feed URL is for and lets the
          user opt into a private token. Rendered last so first-time
          users see the iCal export / cleaner / message pieces before
          the advanced opt-in. */}
      {links.length > 0 && (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[var(--ink)]">
                {locale === "ru" ? "Токен доступа к фиду" : "Feed access token"}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--ink-3)]">
                {locale === "ru"
                  ? "URL фида позволяет внешним сервисам, не поддерживающим загрузку iCal (например, инструментам ценообразования, channel manager-ам или вашим собственным скриптам), читать общий календарь Airbnb + Booking этого объекта в формате iCal. Большинству хостов это не нужно — оставьте поле пустым, чтобы фид оставался публичным, или сгенерируйте токен, чтобы URL был приватным."
                  : "The feed URL lets external services that do not support iCal upload (e.g. price-management tools, channel managers, or your own scripts) read this property's combined Airbnb + Booking calendar in iCal format. Most hosts will not need this — leave the token blank to keep the feed public, or rotate the token to make the URL private."}
              </p>
              <p className="mt-2 text-xs text-[var(--ink-3)]">
                {feedToken
                  ? (locale === "ru"
                      ? "Сейчас URL содержит приватный токен. Ротация делает старый URL недействительным — переустановите новый в местах, где он используется."
                      : "Your feed URLs currently include a private token. Rotating invalidates the old URL — re-paste the new one wherever it's consumed.")
                  : (locale === "ru"
                      ? "Сейчас URL фида публичны. Сгенерируйте токен, чтобы их нельзя было угадать."
                      : "Your feed URLs are currently public. Add a token to make them unguessable.")}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {feedToken && (
                <button
                  onClick={handleClearToken}
                  disabled={rotating}
                  className="rounded-md px-2.5 py-1 text-xs text-[var(--ink-3)] hover:text-[var(--ink)] disabled:opacity-40"
                >
                  {locale === "ru" ? "Сделать публичным" : "Make public"}
                </button>
              )}
              <button
                onClick={handleRotateToken}
                disabled={rotating}
                className="rounded-md bg-[var(--m-accent)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--m-accent-2)] disabled:opacity-40"
              >
                {rotating
                  ? "..."
                  : feedToken
                    ? (locale === "ru" ? "Обновить" : "Rotate")
                    : (locale === "ru" ? "Сгенерировать токен" : "Generate token")}
              </button>
            </div>
          </div>
          {feedToken && (
            <code className="block truncate rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2.5 py-1.5 text-xs text-[var(--ink-2)]">
              ?token={feedToken}
            </code>
          )}
        </div>
      )}

      {/* Danger zone — delete this property. Only the owner can hit
          DELETE /api/properties/:id; the dashboard's handler also
          handles the "navigate away" piece (clears selection, calls
          fetchProperties, etc.). */}
      <section className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-5">
        <h2 className="text-sm font-semibold text-[var(--ink)]">
          {locale === "ru" ? "Опасная зона" : "Danger zone"}
        </h2>
        <p className="mt-1 text-xs text-[var(--ink-3)] leading-relaxed">
          {locale === "ru"
            ? "Удаление объекта стирает все его брони, гостей, паспорта, журналы синхронизации и iCal-привязки. Действие необратимо."
            : "Deleting this property removes all of its reservations, guests, passport documents, sync logs, and iCal links. This cannot be undone."}
        </p>
        <button
          type="button"
          onClick={() => {
            const ok = window.confirm(
              locale === "ru"
                ? `Удалить объект «${propertyName}»? Это удалит все бронирования и связанные данные. Действие необратимо.`
                : `Delete property "${propertyName}"? This removes all reservations and related data. This cannot be undone.`
            );
            if (ok) onDeleteProperty(propertyId);
          }}
          className="mt-3 rounded-md border border-rose-500/40 px-3 py-2 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-500/10"
        >
          {locale === "ru" ? "Удалить объект" : "Delete property"}
        </button>
      </section>
    </div>
  );
}
