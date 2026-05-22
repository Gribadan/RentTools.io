"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GuestCards } from "@/components/guest-cards";
import { DateSlider } from "@/components/date-slider";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import type { Guest, Reservation } from "@/lib/types";

// Pre-arrival discovery hint — localized in all 5 supported locales.
// The rest of this component is still English-only; see GitHub issue
// for the full reservation-view localization pass.
interface HintCopy {
  title: string;
  before: string;
  link: string;
  after: string;
}

const HINT_COPY: Record<Locale, HintCopy> = {
  en: {
    title: "Tip — pre-arrival form.",
    before:
      "You can set up a guest form (passport details, arrival time, questions) under",
    link: "Sync settings → Pre-arrival form",
    after:
      ". Once configured, a shareable link appears here for every reservation.",
  },
  ru: {
    title: "Совет — форма перед заездом.",
    before:
      "Вы можете настроить анкету для гостя (паспортные данные, время заезда, вопросы) в разделе",
    link: "Настройки синхронизации → Форма перед заездом",
    after:
      ". После настройки здесь для каждого бронирования появится ссылка, которой можно поделиться.",
  },
  de: {
    title: "Tipp — Anreiseformular.",
    before:
      "Sie können ein Gästeformular (Ausweisdaten, Ankunftszeit, Fragen) einrichten unter",
    link: "Sync-Einstellungen → Anreiseformular",
    after:
      ". Nach der Einrichtung erscheint hier für jede Reservierung ein teilbarer Link.",
  },
  fr: {
    title: "Astuce — formulaire de pré-arrivée.",
    before:
      "Vous pouvez configurer un formulaire pour le voyageur (données du passeport, heure d’arrivée, questions) dans",
    link: "Paramètres de synchronisation → Formulaire de pré-arrivée",
    after:
      ". Une fois configuré, un lien partageable apparaît ici pour chaque réservation.",
  },
  es: {
    title: "Consejo — formulario previo a la llegada.",
    before:
      "Puede configurar un formulario para el huésped (datos del pasaporte, hora de llegada, preguntas) en",
    link: "Ajustes de sincronización → Formulario previo a la llegada",
    after:
      ". Una vez configurado, aquí aparecerá un enlace para compartir en cada reserva.",
  },
};

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "error" | "processing";
}

interface MessageTemplate {
  id: number;
  propertyId: number;
  name: string;
  language: string;
  subject: string;
  body: string;
}

/** Short platform label matching how hosts name messenger groups by
 *  hand — "Airbnb", "Booking" (without the .com), "Vrbo", etc. Distinct
 *  from `platformDisplayName` elsewhere in the app, which renders
 *  "Booking.com" with the TLD for SEO-facing surfaces. */
function platformShortLabel(slug: string): string {
  const map: Record<string, string> = {
    airbnb: "Airbnb",
    booking: "Booking",
    vrbo: "Vrbo",
    expedia: "Expedia",
    hostaway: "Hostaway",
    lodgify: "Lodgify",
    hospitable: "Hospitable",
    smoobu: "Smoobu",
    direct: "Direct",
    custom: "Direct",
  };
  if (map[slug]) return map[slug];
  if (!slug) return "Booking";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/** Stay date range formatted the way a host names a messenger group:
 *    same year + month         → "12-19 May 2026"
 *    same year, diff months    → "22 May-12 June 2026"
 *    different years           → "29 Dec 2026-3 Jan 2027"
 *  Months are full English names (matches the examples the user gave).
 */
function formatStayRange(checkInIso: string, checkOutIso: string): string {
  const ci = new Date(checkInIso);
  const co = new Date(checkOutIso);
  const ciDay = ci.getDate();
  const coDay = co.getDate();
  const ciMon = ci.toLocaleDateString("en-GB", { month: "long" });
  const coMon = co.toLocaleDateString("en-GB", { month: "long" });
  const ciYear = ci.getFullYear();
  const coYear = co.getFullYear();
  if (ciYear !== coYear) {
    return `${ciDay} ${ciMon} ${ciYear}-${coDay} ${coMon} ${coYear}`;
  }
  if (ci.getMonth() !== co.getMonth()) {
    return `${ciDay} ${ciMon}-${coDay} ${coMon} ${ciYear}`;
  }
  return `${ciDay}-${coDay} ${ciMon} ${ciYear}`;
}

/** Format the standard group-chat name string the "Copy group name"
 *  button writes to the clipboard. Picks the lead guest's first name
 *  (registered guests beat the reservation's free-text name field),
 *  falls back to the reservation name's first token, and lastly to
 *  "Guest" so we never copy an empty placeholder. */
function formatGroupName(
  reservation: Reservation,
  guests: Guest[],
  propertyName: string | undefined,
): string {
  const platform = platformShortLabel(reservation.platform);
  const dates = formatStayRange(reservation.checkIn, reservation.checkOut);
  const leadGuest = guests.find((g) => g.firstName?.trim()) ?? guests[0];
  const guestName = (
    leadGuest?.firstName?.trim() ||
    leadGuest?.fullName?.trim() ||
    reservation.name.split(" ")[0] ||
    "Guest"
  ).trim();
  const prop = (propertyName ?? "Property").trim();
  return `${platform} ${dates} | ${guestName} | ${prop}`;
}

function renderTemplate(input: string, vars: Record<string, string>): string {
  return input.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : `{{${k}}}`
  );
}

interface ReservationViewProps {
  reservation: Reservation;
  guests: Guest[];
  propertyName?: string;
  onGuestsUpdated: () => void;
  onDeleteGuest: (id: number) => void;
  onDeleteReservation: (id: number) => void | Promise<void>;
  onUpdateReservation: (
    id: number,
    data: {
      name?: string;
      checkIn?: string;
      checkOut?: string;
      platform?: string;
      tgGroupUrl?: string | null;
      waGroupUrl?: string | null;
      groupName?: string | null;
    }
  ) => void | Promise<{ ok: true } | { ok: false; error: string }>;
  onUpdateParent: (childId: number, parentId: number | null) => void;
  onUpdateGuest: (id: number, fields: Partial<Guest>) => Promise<void>;
}

export function ReservationView({
  reservation,
  guests,
  propertyName,
  onGuestsUpdated,
  onDeleteGuest,
  onDeleteReservation,
  onUpdateReservation,
  onUpdateParent,
  onUpdateGuest,
}: ReservationViewProps) {
  const { locale } = useI18n();
  const hint = HINT_COPY[locale];
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [extractionResult, setExtractionResult] = useState<{
    total: number;
    successful: number;
    files: { name: string; status: "success" | "failed"; reason?: string }[];
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(reservation.name);
  const [editCheckIn, setEditCheckIn] = useState(
    new Date(reservation.checkIn).toISOString().split("T")[0]
  );
  const [editCheckOut, setEditCheckOut] = useState(
    new Date(reservation.checkOut).toISOString().split("T")[0]
  );
  const [editPlatform, setEditPlatform] = useState(
    reservation.platform || "airbnb"
  );
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<MessageTemplate | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  // Per-reservation group-chat state: a button to copy the standardised
  // group-name string and an inline editor for the two messenger group
  // URLs the host saves once they've created the chat. Both come back
  // through the same PATCH /api/reservations/:id endpoint as the rest
  // of the editable fields.
  const [groupNameCopyState, setGroupNameCopyState] = useState<"idle" | "copied">("idle");
  // null = the host hasn't touched the group-name field this session
  // (field tracks the saved override or the live auto-name). A string
  // = an in-progress edit.
  const [groupNameOverride, setGroupNameOverride] = useState<string | null>(null);
  const [savingGroupName, setSavingGroupName] = useState(false);
  const [editingGroupUrls, setEditingGroupUrls] = useState(false);
  const [editTgGroupUrl, setEditTgGroupUrl] = useState("");
  const [editWaGroupUrl, setEditWaGroupUrl] = useState("");
  const [savingGroupUrls, setSavingGroupUrls] = useState(false);
  const [groupUrlsError, setGroupUrlsError] = useState<string | null>(null);
  // RT-25.2 — pre-arrival guest form share link. hasGuestForm gates
  // the "Copy form link" button so it only shows when the property
  // actually has a template configured. The action is link-generation
  // + clipboard copy — RentTools doesn't send anything to the guest;
  // the host pastes the URL into WhatsApp / SMS / email themselves.
  const [hasGuestForm, setHasGuestForm] = useState(false);
  // True once the guest-form fetch has resolved — gates the
  // "not configured yet" hint so it doesn't flash during loading.
  const [guestFormChecked, setGuestFormChecked] = useState(false);
  const [guestFormGenerating, setGuestFormGenerating] = useState(false);
  const [guestFormCopyState, setGuestFormCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [guestFormSubmission, setGuestFormSubmission] = useState<{
    shareUrl: string;
    sentAt: string;
    submittedAt: string | null;
    answers: { fieldId: string; type: string; label: string; value: unknown }[];
  } | null>(null);
  // RT-25.13 tick 2 — host's pre-saved Telegram / WhatsApp group invite
  // URLs (set under Profile). When at least one is set AND the
  // reservation has a guest with a phone, the "Send group invite"
  // split button renders alongside the pre-arrival CTA.
  const [groupInvites, setGroupInvites] = useState<{ tg: string | null; wa: string | null }>({
    tg: null,
    wa: null,
  });
  const [groupInvitePickerOpen, setGroupInvitePickerOpen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  const groupInviteMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/message-templates?propertyId=${reservation.propertyId}`)
      .then((r) => (r.ok ? r.json() : { templates: [] }))
      .then((d) => {
        if (!cancelled) setTemplates((d.templates || []) as MessageTemplate[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [reservation.propertyId]);

  useEffect(() => {
    if (!templatePickerOpen) return;
    const onClick = (e: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setTemplatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [templatePickerOpen]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/properties/${reservation.propertyId}/guest-form`)
      .then((r) => (r.ok ? r.json() : { template: null }))
      .then((d) => {
        if (!cancelled) {
          setHasGuestForm(!!d.template);
          setGuestFormChecked(true);
        }
      })
      .catch(() => { if (!cancelled) setGuestFormChecked(true); });
    return () => {
      cancelled = true;
    };
  }, [reservation.propertyId]);

  // RT-25.13 tick 2 — read host-saved messenger group invite URLs.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => {
        if (cancelled) return;
        setGroupInvites({
          tg: d.user?.tgGroupInviteUrl ?? null,
          wa: d.user?.waGroupInviteUrl ?? null,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!groupInvitePickerOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        groupInviteMenuRef.current &&
        !groupInviteMenuRef.current.contains(e.target as Node)
      ) {
        setGroupInvitePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [groupInvitePickerOpen]);

  const refreshGuestFormSubmission = useCallback(async () => {
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/guest-form/share`);
      if (!res.ok) return;
      const d = await res.json();
      setGuestFormSubmission(d.submission ?? null);
    } catch {
      // ignore
    }
  }, [reservation.id]);

  useEffect(() => {
    refreshGuestFormSubmission();
  }, [refreshGuestFormSubmission]);

  // Generate (or reuse) the guest's pre-arrival form share URL and
  // place it on the clipboard. RentTools does NOT send anything to the
  // guest — the host pastes the URL into WhatsApp / SMS / email
  // themselves. The endpoint is idempotent on second call: returns the
  // same shareUrl that was minted the first time.
  const copyGuestFormLink = async () => {
    setGuestFormGenerating(true);
    setGuestFormCopyState("idle");
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/guest-form/share`, {
        method: "POST",
      });
      if (!res.ok) {
        setGuestFormCopyState("error");
        return;
      }
      const data = await res.json();
      const fullUrl = `${window.location.origin}${data.shareUrl}`;
      try {
        await navigator.clipboard.writeText(fullUrl);
        setGuestFormCopyState("copied");
        setTimeout(() => setGuestFormCopyState("idle"), 2500);
      } catch {
        setGuestFormCopyState("error");
      }
      refreshGuestFormSubmission();
    } finally {
      setGuestFormGenerating(false);
    }
  };

  const guestFormStatusLabel = (): string | null => {
    if (!guestFormSubmission) return null;
    if (guestFormSubmission.submittedAt) {
      const days = Math.max(
        0,
        Math.round(
          (Date.now() - new Date(guestFormSubmission.submittedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      return days === 0
        ? "Submitted today"
        : `Submitted ${days} day${days === 1 ? "" : "s"} ago`;
    }
    // Avoid the word "Sent" — RentTools doesn't send the link, the host
    // does. We only know when the share token was minted (i.e. when the
    // link was first copied to the clipboard).
    const days = Math.max(
      0,
      Math.round(
        (Date.now() - new Date(guestFormSubmission.sentAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    return days === 0
      ? "Link generated today, awaiting reply"
      : `Link generated ${days} day${days === 1 ? "" : "s"} ago, awaiting reply`;
  };

  const renderGuestFormAnswerValue = (a: { type: string; value: unknown }) => {
    if (a.value === null || a.value === undefined || a.value === "") {
      return <span className="text-muted-foreground italic">No answer</span>;
    }
    if (Array.isArray(a.value)) return a.value.join(", ");
    if (a.type === "yes-no") return a.value === "yes" ? "Yes" : "No";
    return String(a.value);
  };

  const formatIsoDate = (s: string) => new Date(s).toISOString().split("T")[0];

  const templateVars = (): Record<string, string> => ({
    guestName: reservation.name,
    checkIn: formatIsoDate(reservation.checkIn),
    checkOut: formatIsoDate(reservation.checkOut),
    propertyName: propertyName || "",
    wifiPassword: "",
  });

  const renderedSubject = activeTemplate
    ? renderTemplate(activeTemplate.subject, templateVars())
    : "";
  const renderedBody = activeTemplate
    ? renderTemplate(activeTemplate.body, templateVars())
    : "";

  const pickTemplate = (t: MessageTemplate) => {
    setActiveTemplate(t);
    setTemplatePickerOpen(false);
    setCopyState("idle");
  };

  const copyMessage = async () => {
    if (!activeTemplate) return;
    const text = renderedSubject
      ? `${renderedSubject}\n\n${renderedBody}`
      : renderedBody;
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      // clipboard blocked — fall back to selecting the textarea
      const ta = document.getElementById("rendered-message-body") as HTMLTextAreaElement | null;
      ta?.select();
    }
  };

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    const time = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [...prev, { time, message, type }]);
    setTimeout(() => {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
    },
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const extractData = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setError(null);
    setLogs([]);
    setExtractionResult(null);

    addLog(`Starting extraction for ${files.length} file(s)...`, "info");
    const fileResults: { name: string; status: "success" | "failed"; reason?: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      addLog(`[${i + 1}/${files.length}] Processing: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, "processing");

      try {
        const formData = new FormData();
        formData.append("files", file);
        formData.append("reservationId", reservation.id.toString());

        addLog(`[${i + 1}/${files.length}] Sending to Gemini Vision API...`, "processing");

        const response = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const reason = errData.error || `HTTP ${response.status}`;
          addLog(`[${i + 1}/${files.length}] Failed: ${reason}`, "error");
          fileResults.push({ name: file.name, status: "failed", reason });
          continue;
        }

        const json = await response.json();
        const count = json.data?.length || 0;

        if (count > 0) {
          for (const person of json.data) {
            addLog(
              `[${i + 1}/${files.length}] Extracted: ${person.fullName} | ${person.country} | Passport: ${person.passportNumber}`,
              "success"
            );
          }
          fileResults.push({ name: file.name, status: "success" });
        } else {
          addLog(`[${i + 1}/${files.length}] No passport data found in ${file.name}`, "error");
          fileResults.push({ name: file.name, status: "failed", reason: "No passport data found" });
        }
      } catch {
        addLog(`[${i + 1}/${files.length}] Network error processing ${file.name}`, "error");
        fileResults.push({ name: file.name, status: "failed", reason: "Network error" });
      }
    }

    addLog("Extraction complete.", "info");
    const successful = fileResults.filter((r) => r.status === "success").length;
    setExtractionResult({ total: fileResults.length, successful, files: fileResults });
    setFiles([]);
    setLoading(false);
    onGuestsUpdated();
  };

  // Effective group name shown + copied: the host's saved override
  // (reservation.groupName) if set, otherwise the auto-generated one.
  // `groupNameOverride` holds the in-progress edit — null until the
  // host starts typing, so the field tracks the live auto-name (which
  // updates as guests finish loading) until they take control of it.
  const autoGroupName = formatGroupName(reservation, guests, propertyName);
  const groupNameValue = groupNameOverride ?? reservation.groupName ?? autoGroupName;

  const handleCopyGroupName = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(groupNameValue);
      setGroupNameCopyState("copied");
      setTimeout(() => setGroupNameCopyState("idle"), 2000);
    } catch {
      // Clipboard write can fail in non-secure contexts. Silent — the
      // visible group-name field right below the button is the
      // fallback the host can manually select.
    }
  }, [groupNameValue]);

  const handleSaveGroupName = async () => {
    if (groupNameOverride === null) return;
    setSavingGroupName(true);
    await Promise.resolve(
      // Empty string clears the override (PATCH maps "" → null), so the
      // bar falls back to the auto-generated name.
      onUpdateReservation(reservation.id, { groupName: groupNameOverride.trim() }),
    );
    setSavingGroupName(false);
    setGroupNameOverride(null);
  };

  const handleSaveGroupUrls = async () => {
    setSavingGroupUrls(true);
    setGroupUrlsError(null);
    const result = await Promise.resolve(
      onUpdateReservation(reservation.id, {
        tgGroupUrl: editTgGroupUrl.trim() ? editTgGroupUrl.trim() : null,
        waGroupUrl: editWaGroupUrl.trim() ? editWaGroupUrl.trim() : null,
      }),
    );
    setSavingGroupUrls(false);
    if (result && typeof result === "object" && "ok" in result && !result.ok) {
      setGroupUrlsError(result.error);
      return;
    }
    setEditingGroupUrls(false);
  };

  const handleSaveEdit = () => {
    onUpdateReservation(reservation.id, {
      name: editName,
      checkIn: editCheckIn,
      checkOut: editCheckOut,
      platform: editPlatform,
    });
    setEditing(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const exportGuestsCsv = () => {
    if (guests.length === 0) return;

    const headers: (keyof Guest)[] = [
      "id",
      "fullName",
      "firstName",
      "lastName",
      "country",
      "citizenshipCode",
      "dateOfBirth",
      "yearsOld",
      "gender",
      "dateOfIssue",
      "expiryDate",
      "passportNumber",
      "issuedBy",
      "hasVisa",
      "visaNumber",
      "visaFrom",
      "visaTo",
      "parentId",
    ];

    const escape = (val: unknown): string => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      // RFC 4180: quote field if it contains comma, quote, CR or LF; double internal quotes
      if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const rows = [
      headers.join(","),
      ...guests.map((g) => headers.map((h) => escape(g[h])).join(",")),
    ];
    // BOM so Excel detects UTF-8 correctly
    const csv = "﻿" + rows.join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date(reservation.checkIn).toISOString().split("T")[0];
    const safeName = reservation.name.replace(/[^a-zA-Z0-9_-]+/g, "_");
    a.download = `guests-${safeName}-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stayNights = () => {
    const d1 = new Date(reservation.checkIn);
    const d2 = new Date(reservation.checkOut);
    return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
  };
  const stayDays = () => stayNights() + 1;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Reservation Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-3 rounded-xl border border-border/60 bg-card/50 p-4">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-lg font-bold outline-none focus:border-primary/50"
              />
              <div className="flex items-center gap-3">
                <div className="flex rounded-lg bg-background/50 p-0.5">
                  {(["airbnb", "booking"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPlatform(p)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        editPlatform === p
                          ? p === "airbnb"
                            ? "bg-[var(--m-accent)]/15 text-[var(--m-accent)] shadow-sm"
                            : "bg-[#003580]/20 text-sky-500 shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p === "airbnb" ? "Airbnb" : "Booking"}
                    </button>
                  ))}
                </div>
              </div>
              <DateSlider
                checkIn={editCheckIn}
                checkOut={editCheckOut}
                onChangeCheckIn={setEditCheckIn}
                onChangeCheckOut={setEditCheckOut}
              />
              <div className="flex gap-2">
                <Button size="sm" className="rounded-lg text-xs" onClick={handleSaveEdit}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" className="rounded-lg text-xs" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold tracking-tight">
                  {reservation.name}
                </h1>
                <button
                  onClick={() => setEditing(true)}
                  aria-label="Edit reservation"
                  title="Edit"
                  className="rounded-md p-1 text-muted-foreground/60 transition-all hover:bg-muted/50 hover:text-foreground"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete reservation "${reservation.name}"? This removes the reservation and any guests / passport docs attached to it. iCal sync events are not affected.`)) {
                      onDeleteReservation(reservation.id);
                    }
                  }}
                  aria-label="Delete reservation"
                  title="Delete reservation"
                  className="rounded-md p-1 text-muted-foreground/60 transition-all hover:bg-rose-500/10 hover:text-rose-500"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                  reservation.platform === "booking"
                    ? "bg-[#003580]/20 text-sky-500"
                    : "bg-[var(--m-accent)]/10 text-[var(--m-accent)]"
                }`}>
                  {reservation.platform === "booking" ? "Booking.com" : "Airbnb"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(reservation.checkIn)} — {formatDate(reservation.checkOut)}
                </span>
                <Badge variant="outline" className="rounded-md text-xs">
                  {stayNights()} {stayNights() === 1 ? "night" : "nights"} · {stayDays()} {stayDays() === 1 ? "day" : "days"}
                </Badge>
                {guests.length > 0 && (
                  <Badge variant="secondary" className="rounded-md text-xs">
                    {guests.length} guest{guests.length !== 1 && "s"}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RT-25.2 — Pre-arrival form share link. Hidden when the property
          has no GuestFormTemplate configured (set up under Sync Settings).
          Action is generate + copy: RentTools doesn't send anything to
          the guest. The host pastes the link into WhatsApp / SMS / email
          themselves. */}
      {hasGuestForm && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Pre-arrival form</p>
            <p className="text-xs text-muted-foreground">
              {guestFormStatusLabel() ??
                "Copy the link, then share it with your guest via WhatsApp, SMS, or email."}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={copyGuestFormLink}
            disabled={guestFormGenerating}
            className="rounded-lg text-xs"
          >
            {guestFormGenerating
              ? "Generating…"
              : guestFormCopyState === "copied"
                ? "Link copied"
                : guestFormCopyState === "error"
                  ? "Try again"
                  : guestFormSubmission
                    ? "Copy link again"
                    : "Copy form link"}
          </Button>
        </div>
      )}

      {/* Discovery hint — the property has no pre-arrival form template
          yet, so the section above is hidden. Many hosts never set one
          up simply because they don't know it exists. A one-line, low-
          key note surfaces the feature without nagging: a host who
          doesn't want it just reads past it. */}
      {guestFormChecked && !hasGuestForm && (
        <div className="rounded-xl border border-dashed border-border/50 px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{hint.title}</span>{" "}
            {hint.before}{" "}
            <Link
              href={`/dashboard?property=${reservation.propertyId}&view=sync`}
              className="font-medium text-[var(--m-accent)] underline underline-offset-2 hover:text-[var(--m-accent-2)]"
            >
              {hint.link}
            </Link>
            {hint.after}
          </p>
        </div>
      )}

      {/* RT-25.13 tick 2 — Send group invite. Renders only when the host
          has saved at least one messenger invite URL in their profile.
          Disabled (with explanatory tooltip) when no guest has a phone. */}
      {(groupInvites.tg || groupInvites.wa) && (() => {
        const leadGuest = guests.find((g) => g.phone && g.phone.trim().length > 0);
        const phoneRaw = (leadGuest?.phone ?? "").trim();
        const phoneOk = /^\+?\d{7,15}$/.test(phoneRaw);
        const waDigits = phoneRaw.replace(/^\+/, "");
        const tmePath = phoneRaw.startsWith("+") ? phoneRaw : `+${phoneRaw}`;
        const monthShort = (iso: string) =>
          new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        const guestFirst =
          (leadGuest?.firstName || leadGuest?.fullName?.split(" ")[0] || reservation.name.split(" ")[0] || "").trim();
        const groupName = `${propertyName ?? ""} · ${guestFirst} · ${monthShort(reservation.checkIn)}–${monthShort(reservation.checkOut)}`.replace(/^ · /, "");
        const buildPrefill = (url: string) =>
          `Group for your stay: ${groupName}\n\n${url}`;
        const tgHref =
          phoneOk && groupInvites.tg
            ? `https://t.me/${tmePath}?text=${encodeURIComponent(buildPrefill(groupInvites.tg))}`
            : undefined;
        const waHref =
          phoneOk && groupInvites.wa
            ? `https://wa.me/${waDigits}?text=${encodeURIComponent(buildPrefill(groupInvites.wa))}`
            : undefined;
        return (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Group invite</p>
              <p className="text-xs text-muted-foreground">
                {phoneOk
                  ? `Open chat with ${guestFirst || "guest"} in your messenger and prefill the invite link.`
                  : "Add a phone to a guest to enable group invites."}
              </p>
            </div>
            <div className="relative" ref={groupInviteMenuRef}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!phoneOk}
                onClick={() => setGroupInvitePickerOpen((v) => !v)}
                className="rounded-lg text-xs"
                title={
                  phoneOk
                    ? "Send the saved group invite to this guest"
                    : "Add a phone to a guest to enable group invites"
                }
              >
                Send group invite
                <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </Button>
              {groupInvitePickerOpen && phoneOk && (
                <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--bg)] shadow-lg">
                  <ul className="py-1">
                    {tgHref && (
                      <li>
                        <a
                          href={tgHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setGroupInvitePickerOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--ink)] hover:bg-[var(--bg-2)]"
                        >
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#229ED9]/15 text-[#229ED9]">
                            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                              <path d="M11.94.5C5.62.5.5 5.62.5 11.94s5.12 11.44 11.44 11.44 11.44-5.12 11.44-11.44S18.26.5 11.94.5zm5.31 7.86l-1.78 8.4c-.13.6-.49.74-.99.46l-2.74-2.02-1.32 1.27c-.15.15-.27.27-.55.27l.2-2.79 5.07-4.58c.22-.2-.05-.31-.34-.11l-6.27 3.95-2.7-.84c-.59-.18-.6-.59.12-.87l10.55-4.07c.49-.18.92.12.75.93z" />
                            </svg>
                          </span>
                          Send via Telegram
                        </a>
                      </li>
                    )}
                    {waHref && (
                      <li>
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setGroupInvitePickerOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--ink)] hover:bg-[var(--bg-2)]"
                        >
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#25D366]/15 text-[#25D366]">
                            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                              <path d="M20.52 3.48A11.78 11.78 0 0012.05 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.39-1.67a11.85 11.85 0 005.66 1.44h.01c6.55 0 11.85-5.3 11.85-11.85 0-3.16-1.23-6.13-3.39-8.44zM12.06 21.7h-.01a9.84 9.84 0 01-5.02-1.37l-.36-.21-3.79.99 1.01-3.69-.23-.38a9.83 9.83 0 01-1.5-5.19c0-5.44 4.42-9.86 9.87-9.86 2.63 0 5.11 1.03 6.97 2.89a9.79 9.79 0 012.89 6.97c-.01 5.45-4.43 9.85-9.83 9.85zm5.4-7.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.46a8.92 8.92 0 01-1.65-2.05c-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.91-2.18-.24-.58-.49-.5-.66-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.19 5.07 4.47.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.75-.71 2-1.4.25-.69.25-1.27.17-1.4-.07-.13-.27-.2-.57-.35z" />
                            </svg>
                          </span>
                          Send via WhatsApp
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Reservation group chat — host-only convenience. Copy a
          standardised group-name string (so chats across all bookings
          look consistent in your messenger list) and save the group's
          URL once you've created it, so clicking back into the right
          chat from a reservation is one click. Distinct from the
          "Group invite" section above, which sends a HOST-WIDE invite
          link TO the guest's phone. */}
      <div className="space-y-2 rounded-xl border border-border/60 bg-card/40 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">Group chat</p>
            <p className="text-xs text-muted-foreground">
              Copy a standard group name for messenger, then save the group&rsquo;s link to jump back in one click.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopyGroupName}
            className="rounded-lg text-xs"
          >
            {groupNameCopyState === "copied" ? "Copied!" : "Copy group name"}
          </Button>
        </div>

        {/* Editable group name. Pre-filled with the auto-generated
            "[Platform] [dates] | [guest] | [property]" string; the host
            can overwrite it with anything (the "Copy group name" button
            copies whatever is in the field). Empty + Save resets to the
            auto name. */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={groupNameValue}
            onChange={(e) => setGroupNameOverride(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-border/50 bg-background/50 px-2 py-1 text-[11px] text-muted-foreground outline-none transition-colors focus:border-primary/50 focus:text-foreground"
          />
          {groupNameOverride !== null && (
            <Button
              type="button"
              size="sm"
              onClick={handleSaveGroupName}
              disabled={savingGroupName}
              className="rounded-lg text-xs"
            >
              {savingGroupName ? "Saving…" : "Save name"}
            </Button>
          )}
          {groupNameOverride === null && reservation.groupName && (
            <button
              type="button"
              onClick={() => { setGroupNameOverride(""); }}
              className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Reset to auto
            </button>
          )}
        </div>

        {!editingGroupUrls ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {reservation.tgGroupUrl && (
              <a
                href={reservation.tgGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#229ED9]/30 bg-[#229ED9]/10 px-3 py-1.5 text-xs font-medium text-[#229ED9] transition-colors hover:bg-[#229ED9]/20"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                  <path d="M11.94.5C5.62.5.5 5.62.5 11.94s5.12 11.44 11.44 11.44 11.44-5.12 11.44-11.44S18.26.5 11.94.5zm5.31 7.86l-1.78 8.4c-.13.6-.49.74-.99.46l-2.74-2.02-1.32 1.27c-.15.15-.27.27-.55.27l.2-2.79 5.07-4.58c.22-.2-.05-.31-.34-.11l-6.27 3.95-2.7-.84c-.59-.18-.6-.59.12-.87l10.55-4.07c.49-.18.92.12.75.93z" />
                </svg>
                Open Telegram group
              </a>
            )}
            {reservation.waGroupUrl && (
              <a
                href={reservation.waGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-1.5 text-xs font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/20"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                  <path d="M20.52 3.48A11.78 11.78 0 0012.05 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.39-1.67a11.85 11.85 0 005.66 1.44h.01c6.55 0 11.85-5.3 11.85-11.85 0-3.16-1.23-6.13-3.39-8.44zM12.06 21.7h-.01a9.84 9.84 0 01-5.02-1.37l-.36-.21-3.79.99 1.01-3.69-.23-.38a9.83 9.83 0 01-1.5-5.19c0-5.44 4.42-9.86 9.87-9.86 2.63 0 5.11 1.03 6.97 2.89a9.79 9.79 0 012.89 6.97c-.01 5.45-4.43 9.85-9.83 9.85zm5.4-7.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.46a8.92 8.92 0 01-1.65-2.05c-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.91-2.18-.24-.58-.49-.5-.66-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.19 5.07 4.47.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.75-.71 2-1.4.25-.69.25-1.27.17-1.4-.07-.13-.27-.2-.57-.35z" />
                </svg>
                Open WhatsApp group
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                setEditTgGroupUrl(reservation.tgGroupUrl ?? "");
                setEditWaGroupUrl(reservation.waGroupUrl ?? "");
                setGroupUrlsError(null);
                setEditingGroupUrls(true);
              }}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {reservation.tgGroupUrl || reservation.waGroupUrl ? "Edit links" : "Add group links"}
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-[11px] font-medium text-muted-foreground">Telegram</span>
              <input
                type="url"
                value={editTgGroupUrl}
                onChange={(e) => setEditTgGroupUrl(e.target.value)}
                placeholder="https://t.me/+abcdef…"
                className="h-8 flex-1 rounded-md border border-border/50 bg-background/50 px-2 text-xs outline-none focus:border-primary/50"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-[11px] font-medium text-muted-foreground">WhatsApp</span>
              <input
                type="url"
                value={editWaGroupUrl}
                onChange={(e) => setEditWaGroupUrl(e.target.value)}
                placeholder="https://chat.whatsapp.com/…"
                className="h-8 flex-1 rounded-md border border-border/50 bg-background/50 px-2 text-xs outline-none focus:border-primary/50"
              />
            </label>
            <p className="text-[11px] text-muted-foreground">
              Leave a field blank to remove the saved link.
            </p>
            {groupUrlsError && (
              <p className="text-[11px] text-rose-500">{groupUrlsError}</p>
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleSaveGroupUrls}
                disabled={savingGroupUrls}
                className="rounded-lg text-xs"
              >
                {savingGroupUrls ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditingGroupUrls(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border/40 hover:border-primary/30 hover:bg-muted/10"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex min-h-[100px] flex-col items-center justify-center p-6">
          <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            isDragActive ? "bg-primary/15 text-primary scale-110" : "bg-muted/40 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          }`}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-sm font-medium">
            {isDragActive ? "Drop here..." : "Drop passport documents"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground/70">JPG, PNG, PDF</p>
        </div>
      </div>

      {/* Staged Files */}
      {files.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/30 px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {files.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-1 text-[11px]"
              >
                {file.name}
                <button
                  onClick={() => removeFile(index)}
                  className="ml-0.5 rounded p-0.5 hover:bg-foreground/10"
                >
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex shrink-0 gap-2 ml-3">
            <Button variant="ghost" size="sm" className="h-7 rounded-lg text-[11px]" onClick={() => setFiles([])}>
              Clear
            </Button>
            <Button onClick={extractData} disabled={loading} size="sm" className="h-7 rounded-lg text-[11px]">
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Extracting...
                </span>
              ) : (
                `Extract (${files.length})`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Extraction summary */}
      {extractionResult && extractionResult.total > 0 && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            extractionResult.successful === extractionResult.total
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
              : "border-amber-400/30 bg-amber-400/5 text-amber-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {extractionResult.successful === extractionResult.total
                ? `Extracted ${extractionResult.successful}/${extractionResult.total} passports successfully`
                : `${extractionResult.successful}/${extractionResult.total} extracted, ${extractionResult.total - extractionResult.successful} failed`}
            </span>
            <button
              onClick={() => setExtractionResult(null)}
              className="text-muted-foreground/40 hover:text-[var(--ink)]"
              aria-label="Dismiss extraction summary"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {extractionResult.files.some((f) => f.status === "failed") && (
            <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground/80">
              {extractionResult.files
                .filter((f) => f.status === "failed")
                .map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-destructive/80">✗</span>
                    <span className="font-medium">{f.name}</span>
                    {f.reason && <span className="text-muted-foreground/60">— {f.reason}</span>}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {/* Guests action row */}
      {(guests.length > 0 || templates.length > 0) && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {templates.length > 0 && (
            <div className="relative" ref={templateMenuRef}>
              <button
                onClick={() => setTemplatePickerOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-md border border-border/30 bg-card/30 px-3 py-1.5 text-xs font-medium text-[var(--ink-3)] transition-all hover:border-border/60 hover:bg-card/60 hover:text-[var(--ink)]"
                title="Generate a message from a saved template"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.97-4.03 9-9 9-1.41 0-2.74-.32-3.92-.9L3 21l.9-5.08A8.96 8.96 0 013 12c0-4.97 4.03-9 9-9s9 4.03 9 9z" />
                </svg>
                Generate message
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {templatePickerOpen && (
                <div className="absolute right-0 z-20 mt-1 w-64 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--bg)] shadow-lg">
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {templates.map((t) => (
                      <li key={t.id}>
                        <button
                          onClick={() => pickTemplate(t)}
                          className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs text-[var(--ink)] hover:bg-[var(--bg-2)]"
                        >
                          <span className="mt-0.5 rounded bg-[var(--line-2)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--ink-3)]">
                            {t.language}
                          </span>
                          <span className="flex-1">
                            <span className="font-medium">{t.name}</span>
                            {t.subject && (
                              <span className="block truncate text-[11px] text-[var(--ink-4)]">
                                {t.subject}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {guests.length > 0 && (
            <button
              onClick={exportGuestsCsv}
              className="flex items-center gap-1.5 rounded-md border border-border/30 bg-card/30 px-3 py-1.5 text-xs font-medium text-[var(--ink-3)] transition-all hover:border-border/60 hover:bg-card/60 hover:text-[var(--ink)]"
              title="Export all guest data to CSV"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
            </button>
          )}
        </div>
      )}

      {/* Rendered template preview */}
      {activeTemplate && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)]">
          <div className="flex items-center justify-between border-b border-border/30 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-[var(--ink)]">{activeTemplate.name}</span>
              <span className="rounded bg-[var(--line-2)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--ink-3)]">
                {activeTemplate.language}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={copyMessage}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  copyState === "copied"
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-[var(--m-accent)] text-white hover:bg-[var(--m-accent-2)]"
                }`}
              >
                {copyState === "copied" ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => setActiveTemplate(null)}
                className="rounded-md p-1 text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground"
                aria-label="Close template preview"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="space-y-2 p-4 text-xs">
            {renderedSubject && (
              <div className="font-semibold text-[var(--ink)]">{renderedSubject}</div>
            )}
            <textarea
              id="rendered-message-body"
              readOnly
              value={renderedBody}
              rows={Math.min(Math.max(renderedBody.split("\n").length + 1, 4), 16)}
              className="w-full resize-y rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-sans text-[var(--ink-2)] outline-none focus:border-[var(--line-2)]"
            />
          </div>
        </div>
      )}
      <GuestCards
        guests={guests}
        checkIn={reservation.checkIn}
        checkOut={reservation.checkOut}
        propertyName={propertyName}
        onDeleteGuest={onDeleteGuest}
        onUpdateParent={onUpdateParent}
        onUpdateGuest={onUpdateGuest}
      />

      {/* RT-25.2 — Pre-arrival answers panel. Renders the submitted
          GuestFormSubmission keyed by the field labels captured at
          submit time, so editing the template later does not change
          history. */}
      {guestFormSubmission?.submittedAt && guestFormSubmission.answers.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-4">
          <h3 className="text-sm font-semibold">Pre-arrival answers</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {guestFormStatusLabel()}
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {guestFormSubmission.answers.map((a) => (
              <div key={a.fieldId} className="rounded-md border border-border/40 bg-background/40 p-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {a.label || a.fieldId}
                </dt>
                <dd className="mt-1 text-sm text-foreground break-words">
                  {renderGuestFormAnswerValue(a)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Extraction Log — below guests */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)]">
          <div className="flex items-center justify-between border-b border-border/30 px-4 py-2.5">
            <span className="text-xs font-medium text-[var(--ink-3)]">
              Extraction Log
            </span>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-[var(--ink-4)] hover:text-[var(--ink)]"
            >
              Clear
            </button>
          </div>
          <div ref={logRef} className="overflow-y-auto p-4 font-[family-name:var(--font-mono)] text-xs leading-relaxed" style={{ maxHeight: 200 }}>
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="shrink-0 text-[var(--ink-4)]">{log.time}</span>
                <span
                  className={
                    log.type === "success"
                      ? "text-emerald-500"
                      : log.type === "error"
                      ? "text-rose-500"
                      : log.type === "processing"
                      ? "text-amber-400"
                      : "text-[var(--ink-3)]"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
