"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { OnboardingTooltip } from "@/components/onboarding-tooltip";
import { MessageTemplatesPanel } from "@/components/message-templates-panel";
import { PropertyManagersPanel } from "@/components/property-managers-panel";
import { GuestFormBuilder } from "@/components/guest-form-builder";
import { PropertySwitcher } from "@/components/property-switcher";
import { PlatformInstructions } from "@/components/platform-instructions";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import type { CalendarLink, Property, SyncLogEntry } from "@/lib/types";

interface CopyShape {
  save: string;
  cancel: string;
  rename: string;
  platformName: string;
  custom: string;
  remove: string;
  draftImportHint: string;
  addAnother: string;
  daysShort: (n: number) => string;
  nightsShort: (n: number) => string;
  monthsShort: string;
  feedTokenTitle: string;
  feedTokenDesc: string;
  feedTokenActiveNote: string;
  feedTokenPublicNote: string;
  makePublic: string;
  rotate: string;
  generateToken: string;
  dangerZone: string;
  dangerZoneDesc: string;
  confirmDelete: (name: string) => string;
  deleteProperty: string;
  dateLocale: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    save: "Save",
    cancel: "Cancel",
    rename: "Rename",
    platformName: "Platform name",
    custom: "custom",
    remove: "Remove",
    draftImportHint: "Name the platform first to get its import URL.",
    addAnother: "Add another platform",
    daysShort: (n) => (n !== 1 ? "days" : "day"),
    nightsShort: (n) => (n !== 1 ? "nights" : "night"),
    monthsShort: "mo",
    feedTokenTitle: "Feed access token",
    feedTokenDesc:
      "The feed URL lets external services that do not support iCal upload (e.g. price-management tools, channel managers, or your own scripts) read this property's combined Airbnb + Booking calendar in iCal format. Most hosts will not need this — leave the token blank to keep the feed public, or rotate the token to make the URL private.",
    feedTokenActiveNote:
      "Your feed URLs currently include a private token. Rotating invalidates the old URL — re-paste the new one wherever it's consumed.",
    feedTokenPublicNote:
      "Your feed URLs are currently public. Add a token to make them unguessable.",
    makePublic: "Make public",
    rotate: "Rotate",
    generateToken: "Generate token",
    dangerZone: "Danger zone",
    dangerZoneDesc:
      "Deleting this property removes all of its reservations, guests, passport documents, sync logs, and iCal links. This cannot be undone.",
    confirmDelete: (name) =>
      `Delete property "${name}"? This removes all reservations and related data. This cannot be undone.`,
    deleteProperty: "Delete property",
    dateLocale: "en-GB",
  },
  ru: {
    save: "Сохранить",
    cancel: "Отмена",
    rename: "Переименовать",
    platformName: "Название платформы",
    custom: "своё",
    remove: "Удалить",
    draftImportHint: "Назовите платформу, чтобы получить ссылку для обратного импорта.",
    addAnother: "Добавить другую платформу",
    daysShort: () => "дн.",
    nightsShort: () => "ноч.",
    monthsShort: "мес.",
    feedTokenTitle: "Токен доступа к фиду",
    feedTokenDesc:
      "URL фида позволяет внешним сервисам, не поддерживающим загрузку iCal (например, инструментам ценообразования, channel manager-ам или вашим собственным скриптам), читать общий календарь Airbnb + Booking этого объекта в формате iCal. Большинству хостов это не нужно — оставьте поле пустым, чтобы фид оставался публичным, или сгенерируйте токен, чтобы URL был приватным.",
    feedTokenActiveNote:
      "Сейчас URL содержит приватный токен. Ротация делает старый URL недействительным — переустановите новый в местах, где он используется.",
    feedTokenPublicNote:
      "Сейчас URL фида публичны. Сгенерируйте токен, чтобы их нельзя было угадать.",
    makePublic: "Сделать публичным",
    rotate: "Обновить",
    generateToken: "Сгенерировать токен",
    dangerZone: "Опасная зона",
    dangerZoneDesc:
      "Удаление объекта стирает все его брони, гостей, паспорта, журналы синхронизации и iCal-привязки. Действие необратимо.",
    confirmDelete: (name) =>
      `Удалить объект «${name}»? Это удалит все бронирования и связанные данные. Действие необратимо.`,
    deleteProperty: "Удалить объект",
    dateLocale: "ru-RU",
  },
  de: {
    save: "Speichern",
    cancel: "Abbrechen",
    rename: "Umbenennen",
    platformName: "Plattform-Name",
    custom: "eigene",
    remove: "Entfernen",
    draftImportHint: "Benennen Sie zuerst die Plattform, um die Import-URL zu erhalten.",
    addAnother: "Weitere Plattform hinzufügen",
    daysShort: () => "Tage",
    nightsShort: (n) => (n !== 1 ? "Nächte" : "Nacht"),
    monthsShort: "Mon.",
    feedTokenTitle: "Zugriffstoken für Feed",
    feedTokenDesc:
      "Die Feed-URL erlaubt externen Diensten, die keinen iCal-Upload unterstützen (z. B. Preisoptimierungs-Tools, Channel Manager oder eigene Skripte), den kombinierten Airbnb- + Booking-Kalender dieser Unterkunft im iCal-Format zu lesen. Die meisten Hosts brauchen das nicht — lassen Sie das Token leer, damit der Feed öffentlich bleibt, oder generieren Sie ein Token, um die URL privat zu machen.",
    feedTokenActiveNote:
      "Ihre Feed-URLs enthalten aktuell ein privates Token. Beim Rotieren wird die alte URL ungültig — fügen Sie die neue URL überall dort wieder ein, wo sie verwendet wird.",
    feedTokenPublicNote:
      "Ihre Feed-URLs sind aktuell öffentlich. Fügen Sie ein Token hinzu, damit sie nicht erratbar sind.",
    makePublic: "Öffentlich machen",
    rotate: "Rotieren",
    generateToken: "Token generieren",
    dangerZone: "Gefahrenzone",
    dangerZoneDesc:
      "Beim Löschen dieser Unterkunft werden alle Buchungen, Gäste, Pass-Dokumente, Sync-Logs und iCal-Verknüpfungen entfernt. Diese Aktion kann nicht rückgängig gemacht werden.",
    confirmDelete: (name) =>
      `Unterkunft „${name}" löschen? Damit werden alle Buchungen und zugehörigen Daten gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.`,
    deleteProperty: "Unterkunft löschen",
    dateLocale: "de-DE",
  },
  fr: {
    save: "Enregistrer",
    cancel: "Annuler",
    rename: "Renommer",
    platformName: "Nom de la plateforme",
    custom: "personnalisée",
    remove: "Retirer",
    draftImportHint: "Nommez d’abord la plateforme pour obtenir son URL d’import.",
    addAnother: "Ajouter une autre plateforme",
    daysShort: () => "j",
    nightsShort: (n) => (n !== 1 ? "nuits" : "nuit"),
    monthsShort: "mois",
    feedTokenTitle: "Token d’accès au feed",
    feedTokenDesc:
      "L’URL du feed permet à des services externes qui ne prennent pas en charge l’import iCal (outils de tarification, channel managers ou vos propres scripts) de lire le calendrier combiné Airbnb + Booking de ce logement au format iCal. La plupart des hôtes n’en ont pas besoin — laissez le token vide pour garder le feed public, ou générez un token pour rendre l’URL privée.",
    feedTokenActiveNote:
      "Vos URL de feed contiennent actuellement un token privé. La rotation invalide l’ancienne URL — recollez la nouvelle URL partout où elle est utilisée.",
    feedTokenPublicNote:
      "Vos URL de feed sont actuellement publiques. Ajoutez un token pour qu’elles ne soient pas devinables.",
    makePublic: "Rendre public",
    rotate: "Renouveler",
    generateToken: "Générer un token",
    dangerZone: "Zone sensible",
    dangerZoneDesc:
      "La suppression de ce logement efface toutes ses réservations, voyageurs, documents de passeport, journaux de synchronisation et liens iCal. Action irréversible.",
    confirmDelete: (name) =>
      `Supprimer le logement « ${name} » ? Cela effacera toutes les réservations et données associées. Action irréversible.`,
    deleteProperty: "Supprimer le logement",
    dateLocale: "fr-FR",
  },
};

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
  const c = COPY[locale];
  const [links, setLinks] = useState<CalendarLink[]>([]);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  // First-load gate. Without this the page renders the empty-state for
  // the first paint (links=[] before fetch), then snaps back when the
  // links arrive — visible CLS. We hold the conditional sections off
  // until the first fetchData resolves so the layout settles in one
  // step, not two.
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  // Rename + delete are scoped here so the entire property settings
  // page doesn't have to remount when the user toggles edit mode.
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Per-platform local URL input states. Replaces the hard-coded
  // airbnbUrl/bookingUrl pair so the UI can host every preset platform
  // (airbnb, booking, vrbo, …) plus any custom ones the user adds.
  // Hydrated from `links` on every fetchData.
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);

  // Custom platform rows the user has added but not yet saved. Stored as
  // a draft list (same shape as the onboarding wizard) so the user can
  // pick a name + URL before the row exists in `links`. Saving promotes
  // the row into a real CalendarLink and the draft entry is dropped.
  const [customDrafts, setCustomDrafts] = useState<Array<{
    rowId: string;
    platform: string;
    displayName: string;
    color: string;
  }>>([]);

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
      const data: CalendarLink[] = await linksRes.json();
      setLinks(data);
      // Populate URL inputs from EVERY existing link, not just airbnb/booking.
      // The user might have a Vrbo or custom-platform link from the
      // onboarding wizard that wouldn't otherwise hydrate.
      setUrlInputs((prev) => {
        const next = { ...prev };
        for (const l of data) next[l.platform] = l.icalExportUrl;
        return next;
      });
    }
    if (syncRes.ok) {
      const data = await syncRes.json();
      setLogs(data.logs || []);
    }
    if (tokenRes.ok) {
      const data = await tokenRes.json();
      setFeedToken(typeof data.feedToken === "string" ? data.feedToken : null);
    }
    setLoading(false);
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
    setUrlInputs((prev) => {
      const next = { ...prev };
      delete next[platform];
      return next;
    });
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

  // Preset platforms — same set as the onboarding wizard so a host who
  // started there sees a consistent shelf in property settings.
  // `hasInstructions` flags the two presets we ship a step-by-step
  // tutorial for (PlatformInstructions component); other presets just
  // get the URL input + outbound feed URL.
  const PRESETS = [
    { platform: "airbnb", label: "Airbnb", color: "#ff385c", placeholder: "https://www.airbnb.com/calendar/ical/…", hasInstructions: true as const },
    { platform: "booking", label: "Booking.com", color: "#003580", placeholder: "https://admin.booking.com/…/ical.html?…", hasInstructions: true as const },
    { platform: "vrbo", label: "Vrbo", color: "#2c5da9", placeholder: "https://www.vrbo.com/icalendar/…", hasInstructions: false as const },
  ];
  const CUSTOM_PALETTE = ["#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#6366f1"];

  // Build the row list rendered in the platform grid. Order:
  //   1. Presets (airbnb, booking, vrbo) — always shown so the host
  //      knows what we support out of the box, even before connecting.
  //   2. Already-saved non-preset links (custom platforms saved earlier
  //      via onboarding or this same UI).
  //   3. Draft custom rows the user has just clicked "Add another platform"
  //      to create — not yet persisted as a CalendarLink row.
  type PlatformRow = {
    rowId: string;
    platform: string;
    label: string;
    color: string;
    placeholder: string;
    isPreset: boolean;
    isCustom: boolean;
    isDraft: boolean;
    hasInstructions: boolean;
  };
  const presetSlugs = new Set(PRESETS.map((p) => p.platform));
  const customLinks = links.filter((l) => !presetSlugs.has(l.platform));
  const platformRows: PlatformRow[] = [
    ...PRESETS.map((p) => ({
      rowId: `preset:${p.platform}`,
      platform: p.platform,
      label: p.label,
      color: p.color,
      placeholder: p.placeholder,
      isPreset: true,
      isCustom: false,
      isDraft: false,
      hasInstructions: p.hasInstructions,
    })),
    ...customLinks.map((l, i) => ({
      rowId: `link:${l.id}`,
      platform: l.platform,
      // Display name for a saved custom link: humanise the slug.
      // The onboarding wizard persists customName in the OnboardingDraft,
      // but once saved into CalendarLink we only have the slug — the
      // CalendarPlatform table on the server has the canonical
      // displayName, but we don't fetch that here. Title-casing the slug
      // is good enough for the read-back display.
      label: l.platform.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      color: CUSTOM_PALETTE[i % CUSTOM_PALETTE.length],
      placeholder: "https://…",
      isPreset: false,
      isCustom: true,
      isDraft: false,
      hasInstructions: false,
    })),
    ...customDrafts.map((d) => ({
      rowId: d.rowId,
      platform: d.platform,
      label: d.displayName || "Custom platform",
      color: d.color,
      placeholder: "https://…",
      isPreset: false,
      isCustom: true,
      isDraft: true,
      hasInstructions: false,
    })),
  ];

  // Slugify a custom-platform display name for the URL slug. Mirrors the
  // onboarding wizard's clientSlug — kept inline so this file is
  // self-contained.
  const clientSlug = (raw: string): string => {
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
  };

  const addCustomDraft = () => {
    const rowId = `draft:${Math.random().toString(36).slice(2, 8)}`;
    setCustomDrafts((prev) => [
      ...prev,
      {
        rowId,
        platform: rowId, // placeholder — replaced when the user types a name
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

  const removeCustomDraft = (rowId: string) => {
    setCustomDrafts((prev) => prev.filter((d) => d.rowId !== rowId));
  };

  const platforms = platformRows.map((row) => ({
    key: row.platform,
    label: row.label,
    color: row.color,
    url: urlInputs[row.platform] ?? "",
    setUrl: (v: string) => setUrlInputs((prev) => ({ ...prev, [row.platform]: v })),
    placeholder: row.placeholder,
    isPreset: row.isPreset,
    isCustom: row.isCustom,
    isDraft: row.isDraft,
    hasInstructions: row.hasInstructions,
    rowId: row.rowId,
  }));

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
                {c.save}
              </button>
              <button type="button" onClick={() => { setRenaming(false); setRenameValue(propertyName); }} className="rounded-md px-3 py-1.5 text-xs text-[var(--ink-3)] hover:text-[var(--ink)]">
                {c.cancel}
              </button>
            </form>
          ) : (
            <div className="mt-0.5 flex items-center gap-1.5">
              <p className="text-sm text-[var(--ink-3)] truncate">{propertyName}</p>
              <button
                onClick={() => { setRenameValue(propertyName); setRenaming(true); }}
                title={c.rename}
                aria-label={c.rename}
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

      {!loading && links.length === 0 && (
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

      {/* Platform Cards — now dynamic. Renders every preset (airbnb,
          booking, vrbo) plus any saved custom platforms plus any draft
          custom rows the user is composing. The outbound "import this
          back into the platform" feed URL is always visible alongside
          each row so the host can copy it BEFORE connecting too. */}
      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map(({ key: platform, label, color, url, setUrl, placeholder, isPreset, isCustom, isDraft, hasInstructions, rowId }) => {
          const link = getLink(platform);
          const isConnected = !!link;
          const isEditing = editingPlatform === platform || !isConnected;
          const result = testResults[platform];
          const draftRow = isDraft ? customDrafts.find((d) => d.rowId === rowId) : null;

          return (
            <div key={rowId} className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-4 space-y-4">
              {/* Platform header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  {isDraft ? (
                    <input
                      autoFocus
                      value={draftRow?.displayName ?? ""}
                      onChange={(e) => updateCustomDraftName(rowId, e.target.value)}
                      placeholder={c.platformName}
                      className="h-7 min-w-0 flex-1 rounded border border-[var(--line-2)] bg-[var(--bg)] px-2 text-sm font-semibold text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-[var(--ink)]">{label}</span>
                  )}
                  {isCustom && !isDraft && !isPreset && (
                    <span className="rounded-md bg-[var(--bg-3)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--ink-4)]">
                      {c.custom}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {isConnected && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {t("sync.connected")}
                    </span>
                  )}
                  {isDraft && (
                    <button
                      type="button"
                      onClick={() => removeCustomDraft(rowId)}
                      className="rounded p-0.5 text-[var(--ink-4)] hover:bg-[var(--bg-3)] hover:text-rose-400"
                      aria-label={c.remove}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
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
                    placeholder={placeholder || t("sync.pastePlaceholder", { platform: label })}
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
                        disabled={!url.trim() || testing === platform || (isDraft && !draftRow?.displayName.trim())}
                        className="rounded-md bg-[var(--line-2)] px-2.5 py-1 text-xs text-[var(--ink-2)] hover:bg-[var(--line-2)] disabled:opacity-40"
                      >
                        {testing === platform ? "..." : t("common.test")}
                      </button>
                      <button
                        onClick={async () => {
                          await handleSave(platform, url);
                          // For drafts: drop the draft row once persisted —
                          // it'll re-render via the customLinks branch.
                          if (isDraft) removeCustomDraft(rowId);
                        }}
                        disabled={!url.trim() || (isDraft && !draftRow?.displayName.trim())}
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
                    {t("sync.lastSynced")} {new Date(link.lastFetchedAt).toLocaleString(c.dateLocale)}
                  </p>
                )}

                {/* Step-by-step instructions for the two presets we have
                    tutorial copy for. Hidden until expanded so the card
                    stays compact when the user already knows the steps. */}
                {hasInstructions && !isConnected && (platform === "airbnb" || platform === "booking") && (
                  <div className="pt-1">
                    <PlatformInstructions platform={platform} mode="export" />
                  </div>
                )}
              </div>

              {/* Step 2: Import URL — always rendered, not just when
                  connected. Showing the URL pre-connect lets the user
                  copy it into the OTHER platform's import field before
                  they've finished pasting their export URL — which is
                  the actual workflow when wiring two platforms. */}
              <div className="space-y-1.5 border-t border-[var(--line)] pt-3">
                <label className="text-xs text-[var(--ink-3)]">
                  {t("sync.importLabel")} {label}
                </label>
                {isDraft && !draftRow?.displayName.trim() ? (
                  <p className="text-[11px] italic text-[var(--ink-4)]">
                    {c.draftImportHint}
                  </p>
                ) : (
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
                )}
                {hasInstructions && (platform === "airbnb" || platform === "booking") && (
                  <div className="pt-1">
                    <PlatformInstructions platform={platform} mode="import" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add custom platform — matches the onboarding wizard CTA so a
          host who originally added a Hostaway or Plum Guide row in
          onboarding can do the same here. The row appears as a draft;
          fill in the name + URL, hit Save, and it's persisted. */}
      <button
        type="button"
        onClick={addCustomDraft}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--line-2)] px-3 py-2 text-[13px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:border-[var(--ink-3)] transition-colors"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {c.addAnother}
      </button>

      {/* Buffer Settings — gated on `!loading` so it doesn't pop in
          after the first paint. Pre-load links is empty, so without
          the gate the section vanishes for a beat then appears. */}
      {!loading && links.length > 0 && (
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
                          {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n} {c.daysShort(n)}</option>)}
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
                          {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n} {c.daysShort(n)}</option>)}
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
                {[1, 2, 3, 4, 5, 7, 10, 14].map((n) => <option key={n} value={n}>{n} {c.nightsShort(n)}</option>)}
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
                  <option key={n} value={n}>{n} {t("sync.bookingWindowDays")} ({Math.round(n / 30)} {c.monthsShort})</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Property Managers */}
      <PropertyManagersPanel propertyId={propertyId} ownerUserId={ownerUserId} />

      {/* Sync Log — `!loading` gate prevents the section from popping
          in after the first fetchData resolves. */}
      {!loading && logs.length > 0 && (
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
          the advanced opt-in. Gated on `!loading` so the card doesn't
          flash after first paint. */}
      {!loading && links.length > 0 && (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[var(--ink)]">
                {c.feedTokenTitle}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--ink-3)]">
                {c.feedTokenDesc}
              </p>
              <p className="mt-2 text-xs text-[var(--ink-3)]">
                {feedToken ? c.feedTokenActiveNote : c.feedTokenPublicNote}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {feedToken && (
                <button
                  onClick={handleClearToken}
                  disabled={rotating}
                  className="rounded-md px-2.5 py-1 text-xs text-[var(--ink-3)] hover:text-[var(--ink)] disabled:opacity-40"
                >
                  {c.makePublic}
                </button>
              )}
              <button
                onClick={handleRotateToken}
                disabled={rotating}
                className="rounded-md bg-[var(--m-accent)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--m-accent-2)] disabled:opacity-40"
              >
                {rotating ? "..." : feedToken ? c.rotate : c.generateToken}
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
          {c.dangerZone}
        </h2>
        <p className="mt-1 text-xs text-[var(--ink-3)] leading-relaxed">
          {c.dangerZoneDesc}
        </p>
        <button
          type="button"
          onClick={() => {
            const ok = window.confirm(c.confirmDelete(propertyName));
            if (ok) onDeleteProperty(propertyId);
          }}
          className="mt-3 rounded-md border border-rose-500/40 px-3 py-2 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-500/10"
        >
          {c.deleteProperty}
        </button>
      </section>
    </div>
  );
}
