"use client";

import { useState } from "react";
import Link from "next/link";
import { PlatformInstructions } from "@/components/platform-instructions";
import { useI18n } from "@/lib/i18n/context";
import type { CalendarLink } from "@/lib/types";

// In-dashboard onboarding for users who land logged-in (e.g. Google
// One-Tap, signup with no prior /onboard run) and have zero properties.
//
// Empty-state hijack pattern: replaces the entire main column of the
// dashboard until the user has named one property AND saved at least
// one calendar feed (or used the sample-property escape). Auto-advances
// step → step on success so there is no "Next" button to fail to click.
//
// Two steps:
//   1. Name the property + escape: "Try a sample property" creates a
//      fully-populated demo through /api/properties/sample for users
//      who want to look around before committing.
//   2. Connect at least one calendar feed. Preset rows (airbnb,
//      booking, vrbo) match the public /onboard wizard so a host who
//      saw that flow recognises the surface. "Add another platform"
//      mirrors onboarding for custom OTAs. Soft escape: "Add a manual
//      reservation instead" link for hosts who don't list anywhere.
//
// onComplete fires when the wizard's exit conditions are met (sample
// property created, OR property + ≥1 calendar link saved, OR manual-
// reservation escape clicked). The parent reloads its property list
// and the dashboard re-renders without this component.

interface DashboardOnboardingProps {
  /** Called when the user finishes the wizard (or escapes via the
   *  sample-property / manual-reservation paths). The parent should
   *  refetch properties and let the dashboard re-render normally. */
  onComplete: () => void;
}

interface PresetPlatform {
  platform: string;
  label: string;
  color: string;
  placeholder: string;
  hasInstructions: boolean;
}

const PRESETS: PresetPlatform[] = [
  { platform: "airbnb", label: "Airbnb", color: "#ff385c", placeholder: "https://www.airbnb.com/calendar/ical/…", hasInstructions: true },
  { platform: "booking", label: "Booking.com", color: "#003580", placeholder: "https://admin.booking.com/…/ical.html?…", hasInstructions: true },
  { platform: "vrbo", label: "Vrbo", color: "#2c5da9", placeholder: "https://www.vrbo.com/icalendar/…", hasInstructions: false },
];

const CUSTOM_PALETTE = ["#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#6366f1"];

interface CustomDraft {
  rowId: string;
  platform: string;
  displayName: string;
  color: string;
}

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
  return (
    out
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "custom"
  );
}

export function DashboardOnboarding({ onComplete }: DashboardOnboardingProps) {
  const { locale } = useI18n();

  // Step 1 — property name
  const [step, setStep] = useState<1 | 2>(1);
  const [propertyName, setPropertyName] = useState("");
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 — calendar feeds
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [savedLinks, setSavedLinks] = useState<CalendarLink[]>([]);
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null);
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string; futureEvents?: number; totalEvents?: number }>>({});
  const [customDrafts, setCustomDrafts] = useState<CustomDraft[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const setUrl = (platform: string, value: string) =>
    setUrlInputs((prev) => ({ ...prev, [platform]: value }));

  // ── Step 1 actions ──────────────────────────────────────────────

  const createProperty = async () => {
    const trimmed = propertyName.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not create property");
        return;
      }
      const property = await res.json();
      setPropertyId(property.id);
      setStep(2);
    } finally {
      setCreating(false);
    }
  };

  const createSampleProperty = async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/properties/sample", { method: "POST" });
      if (!res.ok) {
        // Fallback to a plain "Sample Apartment" if the sample endpoint is missing.
        const fallback = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Sample Apartment" }),
        });
        if (!fallback.ok) {
          setError("Could not create sample property");
          return;
        }
      }
      // Sample property is fully populated server-side — exit the wizard.
      onComplete();
    } finally {
      setCreating(false);
    }
  };

  // ── Step 2 actions ──────────────────────────────────────────────

  const customLinks = savedLinks.filter((l) => !PRESETS.some((p) => p.platform === l.platform));

  const presetSlugs = new Set(PRESETS.map((p) => p.platform));

  const addCustomDraft = () => {
    const rowId = `draft:${Math.random().toString(36).slice(2, 8)}`;
    setCustomDrafts((prev) => [
      ...prev,
      {
        rowId,
        platform: rowId,
        displayName: "",
        color: CUSTOM_PALETTE[(customLinks.length + prev.length) % CUSTOM_PALETTE.length],
      },
    ]);
  };

  const updateCustomDraftName = (rowId: string, displayName: string) => {
    setCustomDrafts((prev) =>
      prev.map((d) => {
        if (d.rowId !== rowId) return d;
        const slug = clientSlug(displayName);
        const finalSlug = presetSlugs.has(slug) ? `${slug}-custom` : slug;
        return { ...d, displayName, platform: finalSlug };
      }),
    );
  };

  const removeCustomDraft = (rowId: string) =>
    setCustomDrafts((prev) => prev.filter((d) => d.rowId !== rowId));

  const testPlatform = async (platform: string, url: string) => {
    if (!url.trim()) return;
    setTestingPlatform(platform);
    setTestResults((prev) => {
      const next = { ...prev };
      delete next[platform];
      return next;
    });
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
      setTestingPlatform(null);
    }
  };

  const savePlatform = async (platform: string, url: string, displayName?: string) => {
    if (!propertyId || !url.trim() || savingPlatform) return;
    setSavingPlatform(platform);
    setError(null);
    try {
      const res = await fetch("/api/calendar/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, platform, icalExportUrl: url.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not save calendar");
        return;
      }
      const link = await res.json();
      const next = [...savedLinks, link];
      setSavedLinks(next);
      // Clean up the draft entry if this was a custom row.
      if (displayName) {
        setCustomDrafts((prev) => prev.filter((d) => d.platform !== platform));
      }
      // First successful save → wizard goal hit. Auto-exit to the real
      // dashboard so the user sees their data, not the wizard, going
      // forward.
      onComplete();
    } finally {
      setSavingPlatform(null);
    }
  };

  const feedUrl = (platform: string) => {
    if (typeof window === "undefined" || !propertyId) return "";
    return `${window.location.origin}/api/calendar/feed/${propertyId}/for-${platform}.ics`;
  };

  const copyUrl = async (url: string, key: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      window.prompt("Copy this URL:", url);
    }
  };

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-2)]/40 p-6 sm:p-10">
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-3">
        <StepDot active={step === 1} done={step === 2} number={1} />
        <span
          className={`flex-1 border-t ${
            step === 2 ? "border-[var(--m-accent)]" : "border-[var(--line)]"
          }`}
        />
        <StepDot active={step === 2} done={false} number={2} />
      </div>

      {step === 1 && (
        <>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-[1.75rem]">
            {locale === "ru" ? "Назовите свой первый объект" : "Name your first property"}
          </h2>
          <p className="mt-2 max-w-md text-sm text-[var(--ink-3)]">
            {locale === "ru"
              ? "Просто пометка для себя — переименовать можно потом. Следующий шаг — подключить календари."
              : "Just a label for you — you can rename it later. Next we'll connect at least one calendar."}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void createProperty();
            }}
            className="mt-5 space-y-3"
          >
            <input
              autoFocus
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder={locale === "ru" ? "Например: Квартира на Невском" : "e.g. Sunset Apartment"}
              className="h-11 w-full rounded-lg border border-[var(--line-2)] bg-[var(--bg)] px-3.5 text-[15px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--m-accent)]"
              maxLength={100}
            />
            {error && step === 1 && (
              <p role="alert" className="text-sm text-rose-400">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={creating || !propertyName.trim()}
                className="h-11 rounded-lg bg-[var(--m-accent)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-50"
              >
                {creating
                  ? locale === "ru"
                    ? "Создание…"
                    : "Creating…"
                  : locale === "ru"
                    ? "Продолжить →"
                    : "Continue →"}
              </button>
              <button
                type="button"
                onClick={() => void createSampleProperty()}
                disabled={creating}
                className="text-sm text-[var(--ink-3)] underline-offset-4 hover:text-[var(--ink)] hover:underline disabled:opacity-50"
              >
                {locale === "ru"
                  ? "Или попробуйте демо-объект →"
                  : "Or try a sample property →"}
              </button>
            </div>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-[1.75rem]">
            {locale === "ru"
              ? `Подключите календарь к «${propertyName}»`
              : `Connect a calendar to "${propertyName}"`}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[var(--ink-3)]">
            {locale === "ru"
              ? "Вставьте iCal-ссылку с любой платформы, где вы сдаёте. Следующим шагом скопируете нашу ссылку обратно к ним — мы выдаём её в момент сохранения."
              : "Paste the iCal export URL from any platform you list on. Next, you'll copy ours back into them — we generate the import URL the moment you save."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ...PRESETS.map((p) => ({
                rowId: `preset:${p.platform}`,
                platform: p.platform,
                label: p.label,
                color: p.color,
                placeholder: p.placeholder,
                hasInstructions: p.hasInstructions,
                isDraft: false,
                displayName: undefined as string | undefined,
              })),
              ...customDrafts.map((d) => ({
                rowId: d.rowId,
                platform: d.platform,
                label: d.displayName || (locale === "ru" ? "Своя платформа" : "Custom platform"),
                color: d.color,
                placeholder: "https://…",
                hasInstructions: false,
                isDraft: true,
                displayName: d.displayName,
              })),
            ].map((row) => {
              const url = urlInputs[row.platform] ?? "";
              const isSaved = savedLinks.some((l) => l.platform === row.platform);
              const isSaving = savingPlatform === row.platform;
              const isTesting = testingPlatform === row.platform;
              const result = testResults[row.platform];
              return (
                <div
                  key={row.rowId}
                  className={`rounded-lg border p-4 transition-colors ${
                    isSaved
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-[var(--line)] bg-[var(--bg)]"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      {row.isDraft ? (
                        <input
                          autoFocus
                          value={row.displayName ?? ""}
                          onChange={(e) => updateCustomDraftName(row.rowId, e.target.value)}
                          placeholder={
                            locale === "ru" ? "Название платформы" : "Platform name"
                          }
                          className="h-7 min-w-0 flex-1 rounded border border-[var(--line-2)] bg-[var(--bg)] px-2 text-sm font-semibold text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-[var(--ink)]">
                          {row.label}
                        </span>
                      )}
                    </div>
                    {isSaved && (
                      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {locale === "ru" ? "Подключено" : "Connected"}
                      </span>
                    )}
                    {row.isDraft && (
                      <button
                        type="button"
                        onClick={() => removeCustomDraft(row.rowId)}
                        className="rounded p-0.5 text-[var(--ink-4)] hover:bg-[var(--bg-3)] hover:text-rose-400"
                        aria-label="Remove"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {!isSaved && (
                    <>
                      <div className="flex gap-1.5">
                        <input
                          value={url}
                          onChange={(e) => setUrl(row.platform, e.target.value)}
                          placeholder={row.placeholder}
                          disabled={
                            row.isDraft && !(row.displayName ?? "").trim()
                          }
                          className="h-8 flex-1 rounded-md border border-[var(--line-2)] bg-[var(--bg-2)]/40 px-2.5 text-xs text-[var(--ink)] placeholder-[var(--ink-4)] outline-none focus:border-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => void testPlatform(row.platform, url)}
                          disabled={!url.trim() || isTesting || isSaving}
                          className="rounded-md border border-[var(--line-2)] px-2.5 py-1 text-xs text-[var(--ink-2)] hover:bg-[var(--bg-3)] disabled:opacity-40"
                        >
                          {isTesting ? "…" : locale === "ru" ? "Проверить" : "Test"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void savePlatform(row.platform, url, row.displayName)
                          }
                          disabled={
                            !url.trim() ||
                            isSaving ||
                            (row.isDraft && !(row.displayName ?? "").trim())
                          }
                          className="rounded-md bg-[var(--m-accent)] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-40"
                        >
                          {isSaving
                            ? "…"
                            : locale === "ru"
                              ? "Сохранить"
                              : "Save"}
                        </button>
                      </div>
                      {result && (
                        <p
                          className={`mt-2 text-[11px] ${
                            result.success ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {result.success
                            ? `${result.futureEvents ?? 0} upcoming · ${result.totalEvents ?? 0} total events`
                            : result.error}
                        </p>
                      )}
                      {row.hasInstructions &&
                        (row.platform === "airbnb" || row.platform === "booking") && (
                          <div className="mt-2">
                            <PlatformInstructions
                              platform={row.platform}
                              mode="export"
                            />
                          </div>
                        )}
                    </>
                  )}

                  {isSaved && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] uppercase tracking-wider text-[var(--ink-4)]">
                        {locale === "ru"
                          ? `Скопируйте обратно в ${row.label}:`
                          : `Paste back into ${row.label}:`}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <code className="flex-1 truncate rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2.5 py-1.5 text-[11px] text-[var(--ink-2)]">
                          {feedUrl(row.platform)}
                        </code>
                        <button
                          type="button"
                          onClick={() =>
                            void copyUrl(feedUrl(row.platform), `feed-${row.platform}`)
                          }
                          className="shrink-0 rounded-md bg-[var(--line-2)] px-2.5 py-1.5 text-[11px] text-[var(--ink-2)] hover:bg-[var(--bg-3)]"
                        >
                          {copied === `feed-${row.platform}`
                            ? locale === "ru"
                              ? "Скопировано"
                              : "Copied"
                            : locale === "ru"
                              ? "Копировать"
                              : "Copy"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addCustomDraft}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--line-2)] px-3 py-2 text-[13px] text-[var(--ink-3)] transition-colors hover:border-[var(--ink-3)] hover:text-[var(--ink)]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 1v12M1 7h12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {locale === "ru" ? "Добавить другую платформу" : "Add another platform"}
          </button>

          {error && step === 2 && (
            <p role="alert" className="mt-3 text-sm text-rose-400">
              {error}
            </p>
          )}

          {/* Soft escape — for hosts who don't list on any platform.
              Routes them straight to the property's calendar so they
              can add a manual reservation. The wizard exits via the
              same onComplete path so the dashboard re-renders. */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4 text-[13px]">
            <span className="text-[var(--ink-4)]">
              {locale === "ru" ? "Не размещаете нигде?" : "Not listing anywhere?"}
            </span>
            <Link
              href={propertyId ? `/dashboard?property=${propertyId}&view=calendar` : "/dashboard"}
              onClick={() => onComplete()}
              className="text-[var(--m-accent)] underline-offset-4 hover:text-[var(--m-accent-2)] hover:underline"
            >
              {locale === "ru"
                ? "Добавить бронь вручную →"
                : "Add a manual reservation instead →"}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function StepDot({ active, done, number }: { active: boolean; done: boolean; number: number }) {
  if (done) {
    return (
      <span
        aria-label={`Step ${number} complete`}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--m-accent)] text-white"
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  return (
    <span
      aria-current={active ? "step" : undefined}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
        active
          ? "bg-[var(--m-accent)] text-white"
          : "bg-[var(--bg-3)] text-[var(--ink-4)]"
      }`}
    >
      {number}
    </span>
  );
}
