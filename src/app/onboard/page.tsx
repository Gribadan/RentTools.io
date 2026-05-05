"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlatformInstructions } from "@/components/platform-instructions";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

/* ────────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────────── */

interface DraftLink {
  platform: string;
  customName?: string;
  color?: string;
  icalExportUrl: string;
  lastTestStatus?: "valid" | "invalid";
}

interface DraftRow {
  /** Local-only id so the React key is stable across renders */
  rowId: string;
  /** Canonical platform slug. For custom platforms this is the slugified customName. */
  platform: string;
  /** Display name shown to the user. Editable for custom; fixed for presets. */
  customName?: string;
  /** Hex color for the platform pill */
  color: string;
  /** Whether the row is included in the saved draft + feed URL list */
  enabled: boolean;
  url: string;
  /** Local UI status — separate from saved status so the user sees fresh feedback */
  testStatus: "untested" | "testing" | "valid" | "invalid" | "error";
  testReason?: string;
  /** Toggle for the instructions panel */
  instructionsOpen: boolean;
}

interface Preset {
  platform: string;
  displayName: string;
  color: string;
  exportPlaceholder: string;
  /** Whether the existing PlatformInstructions component knows how to render
      tutorial content for this preset (today: airbnb + booking only). */
  hasInstructions: boolean;
}

const PRESETS: Preset[] = [
  {
    platform: "airbnb",
    displayName: "Airbnb",
    color: "#ff385c",
    exportPlaceholder: "https://www.airbnb.com/calendar/ical/…",
    hasInstructions: true,
  },
  {
    platform: "booking",
    displayName: "Booking.com",
    color: "#003580",
    exportPlaceholder: "https://admin.booking.com/…/ical.html?…",
    hasInstructions: true,
  },
  {
    platform: "vrbo",
    displayName: "Vrbo",
    color: "#2c5da9",
    exportPlaceholder: "https://www.vrbo.com/icalendar/…",
    hasInstructions: false,
  },
];

/** Cycle through this palette when auto-assigning a colour to a custom platform. */
const CUSTOM_PALETTE = ["#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#6366f1"];

/* ────────────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────────── */

function newRowId() {
  return Math.random().toString(36).slice(2, 10);
}

/** Mirror of slugify() in src/lib/slugify.ts but client-side. Kept tight —
    we only need the subset needed for picking a custom platform slug. */
function clientSlug(raw: string): string {
  if (!raw) return "custom";
  const cyr: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
    я: "ya", є: "ye", і: "i", ї: "yi", ґ: "g", ў: "u",
  };
  let out = "";
  for (const ch of raw) {
    const lower = ch.toLowerCase();
    out += cyr[lower] !== undefined ? cyr[lower] : lower.normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  const cleaned = out
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return cleaned || "custom";
}

function feedUrl(slug: string, platform: string): string {
  // SSR-safe: window may not exist on first render
  const origin = typeof window === "undefined" ? "https://renttools.io" : window.location.origin;
  return `${origin}/api/calendar/feed/${slug}/for-${platform}.ics`;
}

function presetRow(preset: Preset): DraftRow {
  return {
    rowId: newRowId(),
    platform: preset.platform,
    color: preset.color,
    enabled: false,
    url: "",
    testStatus: "untested",
    instructionsOpen: false,
  };
}

/* ────────────────────────────────────────────────────────────────────
   Page
──────────────────────────────────────────────────────────────────── */

export default function OnboardPage() {
  const router = useRouter();
  const [propertyName, setPropertyName] = useState("");
  const [feedSlug, setFeedSlug] = useState<string | null>(null);
  const [rows, setRows] = useState<DraftRow[]>(() => PRESETS.map(presetRow));
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  /* ── hydrate from existing draft on mount ─────────────────────── */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/onboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { draft: { propertyName: string; feedSlug: string | null; links: DraftLink[] } | null } | null) => {
        if (cancelled) return;
        if (data?.draft) {
          setPropertyName(data.draft.propertyName);
          setFeedSlug(data.draft.feedSlug);
          // Hydrate rows: presets first, then any custom links from the draft.
          const seenPresets = new Set<string>();
          const hydrated: DraftRow[] = PRESETS.map((p) => {
            const link = data.draft!.links.find((l) => l.platform === p.platform);
            seenPresets.add(p.platform);
            return {
              ...presetRow(p),
              enabled: !!link,
              url: link?.icalExportUrl ?? "",
              testStatus: link?.lastTestStatus === "valid" ? "valid" : link?.lastTestStatus === "invalid" ? "invalid" : "untested",
            };
          });
          for (const link of data.draft.links) {
            if (seenPresets.has(link.platform)) continue;
            hydrated.push({
              rowId: newRowId(),
              platform: link.platform,
              customName: link.customName,
              color: link.color || CUSTOM_PALETTE[hydrated.length % CUSTOM_PALETTE.length],
              enabled: true,
              url: link.icalExportUrl,
              testStatus: link.lastTestStatus === "valid" ? "valid" : link.lastTestStatus === "invalid" ? "invalid" : "untested",
              instructionsOpen: false,
            });
          }
          setRows(hydrated);
        }
        setHydrated(true);
      })
      .catch(() => !cancelled && setHydrated(true));
    return () => { cancelled = true; };
  }, []);

  /* ── persist debounced ─────────────────────────────────────────── */
  const persist = useCallback(async (next: { propertyName: string; rows: DraftRow[] }) => {
    setSaving(true);
    try {
      const links: DraftLink[] = next.rows
        .filter((r) => r.enabled && r.url.trim())
        .map((r) => ({
          platform: r.platform,
          icalExportUrl: r.url.trim(),
          ...(r.customName ? { customName: r.customName } : {}),
          color: r.color,
          ...(r.testStatus === "valid" || r.testStatus === "invalid" ? { lastTestStatus: r.testStatus } : {}),
        }));
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyName: next.propertyName.trim(), links }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.draft?.feedSlug) setFeedSlug(data.draft.feedSlug);
      }
    } finally {
      setSaving(false);
    }
  }, []);

  // Debounce persist on changes — 600ms after the last edit.
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => persist({ propertyName, rows }), 600);
    return () => clearTimeout(t);
  }, [hydrated, propertyName, rows, persist]);

  /* ── row mutations ─────────────────────────────────────────────── */
  const updateRow = useCallback((rowId: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)));
  }, []);

  const toggleRow = useCallback((rowId: string) => {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, enabled: !r.enabled, instructionsOpen: !r.enabled } : r))
    );
  }, []);

  const removeRow = useCallback((rowId: string) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  }, []);

  const addCustomRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        rowId: newRowId(),
        platform: `custom-${newRowId()}`,
        customName: "",
        color: CUSTOM_PALETTE[prev.length % CUSTOM_PALETTE.length],
        enabled: true,
        url: "",
        testStatus: "untested",
        instructionsOpen: false,
      },
    ]);
  }, []);

  const setCustomName = useCallback((rowId: string, customName: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r;
        const slug = clientSlug(customName);
        // Avoid colliding with preset platform slugs by suffixing.
        const presetSlugs = new Set(PRESETS.map((p) => p.platform));
        const finalSlug = presetSlugs.has(slug) ? `${slug}-custom` : slug;
        return { ...r, customName, platform: finalSlug };
      })
    );
  }, []);

  /* ── per-row test fetch ───────────────────────────────────────── */
  const testRow = useCallback(async (rowId: string) => {
    const row = rows.find((r) => r.rowId === rowId);
    if (!row?.url.trim()) return;
    updateRow(rowId, { testStatus: "testing" });
    try {
      const res = await fetch("/api/onboard/test-platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: row.url.trim() }),
      });
      const data = await res.json();
      updateRow(rowId, {
        testStatus: data.ok ? "valid" : "invalid",
        testReason: data.ok ? undefined : data.reason,
      });
    } catch {
      updateRow(rowId, { testStatus: "error", testReason: "network" });
    }
  }, [rows, updateRow]);

  /* ── copy to clipboard ────────────────────────────────────────── */
  const copyText = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      /* ignore — older browsers */
    }
  }, []);

  /* ── derived state ────────────────────────────────────────────── */
  const enabledCount = rows.filter((r) => r.enabled).length;
  const validCount = rows.filter((r) => r.enabled && r.testStatus === "valid").length;

  /* ── submit ───────────────────────────────────────────────────── */
  const handleSaveAndSignup = async () => {
    await persist({ propertyName, rows });
    router.push("/signup?from=onboard");
  };

  /* ── UI ───────────────────────────────────────────────────────── */
  return (
    <div className="editorial min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-[920px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--ink)] text-[var(--bg)] transition-transform group-hover:rotate-6">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12l9-9 9 9" />
                <path d="M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10" />
              </svg>
            </div>
            <span className="display text-[17px] font-semibold tracking-tight text-[var(--ink)]">RentTools</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/login" className="rounded-md px-3 py-1.5 text-[13px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)] transition-colors">
              Sign in
            </Link>
            <span className="mx-1 h-4 w-px bg-[var(--line)]" />
            <ThemeToggle />
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1">
        <div className="mx-auto max-w-[920px] px-6 py-10 sm:py-14">
          <div className="text-center">
            <p className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">Onboarding · 1 property · forever free</p>
            <h1 className="display mt-3 text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--ink)] sm:text-[44px]">
              Set up your <span className="italic font-normal">first property</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] text-[15px] leading-relaxed text-[var(--ink-2)]">
              Pick the platforms you list on, paste each one&apos;s iCal export URL, and copy the URLs we generate back into them. You can do this without an account first — sign up at the end to keep your data.
            </p>
          </div>

          {!hydrated ? (
            <div className="mt-10 rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-8 text-center text-sm text-[var(--ink-3)]">
              Loading…
            </div>
          ) : (
            <div className="mt-10 space-y-6">
              {/* Property name */}
              <Card title="Property name" subtitle="Just a label for you. You can rename it later.">
                <input
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="My first property"
                  className="h-11 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-[14px] text-[var(--ink)] placeholder-[var(--ink-4)] outline-none focus:border-[var(--ink)] transition-colors"
                  autoFocus
                />
              </Card>

              {/* Platform rows */}
              <Card
                title="Where do you list this property?"
                subtitle="Tick each platform you use — paste their iCal URL, copy ours back. Anything not on this list, add as Custom."
              >
                <div className="space-y-3">
                  {rows.map((row) => (
                    <PlatformRow
                      key={row.rowId}
                      row={row}
                      preset={PRESETS.find((p) => p.platform === row.platform) ?? null}
                      feedSlug={feedSlug}
                      copied={copied}
                      onToggle={() => toggleRow(row.rowId)}
                      onUrlChange={(url) => updateRow(row.rowId, { url, testStatus: "untested" })}
                      onCustomNameChange={(name) => setCustomName(row.rowId, name)}
                      onColorChange={(color) => updateRow(row.rowId, { color })}
                      onToggleInstructions={() => updateRow(row.rowId, { instructionsOpen: !row.instructionsOpen })}
                      onRemove={() => removeRow(row.rowId)}
                      onTest={() => testRow(row.rowId)}
                      onCopy={(text, key) => copyText(text, key)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addCustomRow}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--line-2)] px-3 py-2 text-[13px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:border-[var(--ink-3)] transition-colors"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Add another platform
                </button>
              </Card>

              {/* Submit */}
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-6 sm:p-8">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-[17px] font-semibold text-[var(--ink)]">Save and create your free account</h2>
                    <p className="mt-1 text-[13px] text-[var(--ink-2)]">
                      {enabledCount === 0
                        ? "You can sign up without picking a platform — add them later from the dashboard."
                        : `${validCount} of ${enabledCount} platform${enabledCount === 1 ? "" : "s"} verified. Anything unverified you can fix after signup.`}
                    </p>
                  </div>
                  <button
                    onClick={handleSaveAndSignup}
                    disabled={saving}
                    className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--m-accent)] px-6 text-[14px] font-medium text-white shadow-[0_2px_8px_rgba(255,56,92,0.2)] transition-all hover:bg-[var(--m-accent-2)] hover:translate-y-[-1px] disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save and create account"}
                    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M3 7h8m0 0L7 3m4 4l-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <p className="mt-3 text-[12px] text-[var(--ink-3)]">
                  Forever free, no credit card. Already have an account?{" "}
                  <Link href="/login" className="text-[var(--ink)] underline-offset-2 hover:underline">Sign in</Link>.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Components
──────────────────────────────────────────────────────────────────── */

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-6 sm:p-8">
      <div className="mb-5">
        <h2 className="text-[16px] font-semibold tracking-tight text-[var(--ink)]">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-2)]">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

interface PlatformRowProps {
  row: DraftRow;
  preset: Preset | null;
  feedSlug: string | null;
  copied: string | null;
  onToggle: () => void;
  onUrlChange: (v: string) => void;
  onCustomNameChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onToggleInstructions: () => void;
  onRemove: () => void;
  onTest: () => void;
  onCopy: (text: string, key: string) => void;
}

function PlatformRow({
  row,
  preset,
  feedSlug,
  copied,
  onToggle,
  onUrlChange,
  onCustomNameChange,
  onColorChange,
  onToggleInstructions,
  onRemove,
  onTest,
  onCopy,
}: PlatformRowProps) {
  const isCustom = !preset;
  const display = preset?.displayName ?? (row.customName?.trim() || "Custom platform");
  const ourFeedUrl = feedSlug ? feedUrl(feedSlug, row.platform) : null;
  const copyKey = `our-${row.rowId}`;

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg)] transition-colors hover:border-[var(--line-2)]">
      {/* Header row: enabled toggle + name + color + remove (if custom) */}
      <div className="flex items-center gap-3 px-4 py-3">
        <input
          type="checkbox"
          checked={row.enabled}
          onChange={onToggle}
          aria-label={`Enable ${display}`}
          className="h-4 w-4 cursor-pointer accent-[var(--m-accent)]"
        />
        <span
          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: row.color }}
          aria-hidden="true"
        />
        {isCustom ? (
          <input
            value={row.customName ?? ""}
            onChange={(e) => onCustomNameChange(e.target.value)}
            placeholder="Custom platform name"
            className="flex-1 bg-transparent text-[14px] font-medium text-[var(--ink)] placeholder-[var(--ink-4)] outline-none"
          />
        ) : (
          <span className="flex-1 text-[14px] font-medium text-[var(--ink)]">{display}</span>
        )}
        {row.enabled && (
          <ColorSwatchButton color={row.color} onChange={onColorChange} />
        )}
        {isCustom && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[var(--ink-4)] hover:text-[var(--ink-2)] transition-colors"
            aria-label="Remove this platform"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Body — URL inputs + test + RentTools URL — only when enabled */}
      {row.enabled && (
        <div className="border-t border-[var(--line)] px-4 py-4 space-y-3">
          {preset?.hasInstructions && (
            <button
              type="button"
              onClick={onToggleInstructions}
              className="text-[12px] text-[var(--ink-3)] hover:text-[var(--ink)] inline-flex items-center gap-1"
            >
              <svg className={`h-3 w-3 transition-transform ${row.instructionsOpen ? "rotate-90" : ""}`} viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {row.instructionsOpen ? "Hide" : "Show"} instructions for {display}
            </button>
          )}
          {row.instructionsOpen && preset?.hasInstructions && (preset.platform === "airbnb" || preset.platform === "booking") && (
            <div className="rounded-md border border-[var(--line)] bg-[var(--bg-2)] p-3">
              <PlatformInstructions platform={preset.platform} mode="export" />
            </div>
          )}

          {/* URL input + test button */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--ink-2)] mb-1.5">
              {display} iCal export URL
            </label>
            <div className="flex gap-2">
              <input
                value={row.url}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder={preset?.exportPlaceholder ?? "https://…"}
                className="h-10 flex-1 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-[13px] text-[var(--ink)] placeholder-[var(--ink-4)] outline-none focus:border-[var(--ink)] transition-colors"
              />
              <TestButton status={row.testStatus} onClick={onTest} disabled={!row.url.trim()} />
            </div>
            {row.testStatus === "invalid" && (
              <p className="mt-1.5 text-[11.5px] text-rose-700">
                {row.testReason === "bad_url"
                  ? "URL doesn't look right — check for missing https://"
                  : row.testReason === "unreachable"
                    ? "Couldn't reach that URL. The platform may be slow — try again in a minute."
                    : row.testReason === "not_ical"
                      ? "URL responded but doesn't return a calendar. Double-check you copied the iCal export, not the listing page."
                      : "Couldn't verify this URL — you can still save and we'll keep trying after signup."}
              </p>
            )}
            {row.testStatus === "valid" && (
              <p className="mt-1.5 text-[11.5px] text-emerald-700">
                Looks good — we&apos;ll start syncing every 10 minutes after you sign up.
              </p>
            )}
          </div>

          {/* RentTools feed URL for this platform */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--ink-2)] mb-1.5">
              Paste this RentTools URL back into {display}
            </label>
            <div className="flex gap-2">
              <code className="h-10 flex-1 select-all rounded-md border border-[var(--line)] bg-[var(--bg-2)] px-3 text-[12px] text-[var(--ink-2)] flex items-center overflow-x-auto whitespace-nowrap">
                {ourFeedUrl ?? "URL appears once you save the property name above"}
              </code>
              <button
                type="button"
                onClick={() => ourFeedUrl && onCopy(ourFeedUrl, copyKey)}
                disabled={!ourFeedUrl}
                className="h-10 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-[12.5px] text-[var(--ink)] hover:bg-[var(--bg-2)] transition-colors disabled:opacity-40"
              >
                {copied === copyKey ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-1.5 text-[11.5px] text-[var(--ink-3)]">
              This URL is yours forever — even after signup. It&apos;ll start serving live data once you complete signup.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TestButton({ status, onClick, disabled }: { status: DraftRow["testStatus"]; onClick: () => void; disabled?: boolean }) {
  const label = status === "testing" ? "Testing…" : status === "valid" ? "Verified" : status === "invalid" || status === "error" ? "Retry" : "Test fetch";
  const tone =
    status === "valid"
      ? "border-transparent bg-emerald-700 text-white"
      : status === "invalid" || status === "error"
        ? "border-rose-700 bg-[var(--bg)] text-rose-700"
        : "border-[var(--line-2)] bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--bg-2)]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || status === "testing"}
      className={`inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-[12.5px] font-medium transition-colors disabled:opacity-40 ${tone}`}
      aria-live="polite"
    >
      {status === "valid" && (
        <svg className="h-3 w-3" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {(status === "invalid" || status === "error") && (
        <svg className="h-3 w-3" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )}
      {label}
    </button>
  );
}

function ColorSwatchButton({ color, onChange }: { color: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-5 w-5 rounded-md border border-[var(--line-2)] hover:border-[var(--ink-3)] transition-colors"
        style={{ backgroundColor: color }}
        aria-label="Change color"
      />
      {open && (
        <div className="absolute right-0 top-7 z-10 flex gap-1.5 rounded-md border border-[var(--line-2)] bg-[var(--bg)] p-2 shadow-lg">
          {[...CUSTOM_PALETTE, "#ff385c", "#003580"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setOpen(false); }}
              className="h-5 w-5 rounded-md border border-[var(--line-2)] transition-transform hover:scale-110"
              style={{ backgroundColor: c }}
              aria-label={`Set color to ${c}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
