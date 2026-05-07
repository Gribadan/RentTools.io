"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n/context";
import { toBcp47 } from "@/lib/i18n/locale-tags";
import type { Locale } from "@/lib/i18n/translations";

interface CopyShape {
  heading: string;
  body: string;
  guestNameLabel: string;
  guestNamePlaceholder: string;
  defaultGuestFallback: string;
  cancel: string;
  save: string;
  saving: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    heading: "Name this booking",
    body: "This booking came in from iCal. Give it a guest name so it shows up in your list.",
    guestNameLabel: "Guest name",
    guestNamePlaceholder: "Jane Doe",
    defaultGuestFallback: "Guest",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving…",
  },
  ru: {
    heading: "Назвать бронь",
    body: "Эта бронь подтянулась из iCal. Дайте ей имя, чтобы видеть гостя в списке.",
    guestNameLabel: "Имя гостя",
    guestNamePlaceholder: "Иван Петров",
    defaultGuestFallback: "Гость",
    cancel: "Отмена",
    save: "Сохранить",
    saving: "Сохраняю…",
  },
  de: {
    heading: "Buchung benennen",
    body: "Diese Buchung kam über iCal herein. Vergeben Sie einen Gastnamen, damit sie in Ihrer Liste erscheint.",
    guestNameLabel: "Gastname",
    guestNamePlaceholder: "Max Mustermann",
    defaultGuestFallback: "Gast",
    cancel: "Abbrechen",
    save: "Speichern",
    saving: "Wird gespeichert…",
  },
  fr: {
    heading: "Nommer cette réservation",
    body: "Cette réservation est arrivée via iCal. Donnez-lui un nom de voyageur pour qu’elle apparaisse dans votre liste.",
    guestNameLabel: "Nom du voyageur",
    guestNamePlaceholder: "Jean Dupont",
    defaultGuestFallback: "Voyageur",
    cancel: "Annuler",
    save: "Enregistrer",
    saving: "Enregistrement…",
  },
  es: {
    heading: "Nombrar esta reserva",
    body: "Esta reserva entró por iCal. Asígnele un nombre de huésped para que aparezca en su lista.",
    guestNameLabel: "Nombre del huésped",
    guestNamePlaceholder: "Juan García",
    defaultGuestFallback: "Huésped",
    cancel: "Cancelar",
    save: "Guardar",
    saving: "Guardando…",
  },
};

export interface ClaimableBar {
  eventUid: string;
  startDate: string;
  endDate: string;
  platform: string;
  /** Existing iCal SUMMARY (e.g. "Reserved" / a Booking confirmation
   *  number). Used as the placeholder so the user knows what the feed
   *  currently calls this stay. */
  defaultName: string;
}

interface BarClaimPopoverProps {
  bar: ClaimableBar;
  anchorRect: DOMRect;
  onClose: () => void;
  onSave: (name: string) => Promise<void> | void;
}

// Companion to DateActionsPopover for synced bookings that haven't been
// claimed yet (no Reservation row exists, just an iCal event). Lets the
// user attach a guest name without first having to click the empty cell
// area and use "Add reservation".
export function BarClaimPopover({ bar, anchorRect, onClose, onSave }: BarClaimPopoverProps) {
  const { t, locale } = useI18n();
  const c = COPY[locale];
  const popRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) onClose();
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [onClose]);

  const popWidth = 300;
  const margin = 8;
  let left = anchorRect.left;
  if (left + popWidth + margin > window.innerWidth) {
    left = window.innerWidth - popWidth - margin;
  }
  if (left < margin) left = margin;
  let top = anchorRect.bottom + 6;
  if (top + 220 > window.innerHeight && anchorRect.top - 6 - 220 > 0) {
    top = anchorRect.top - 6 - 220;
  }

  const platformLabel = bar.platform === "booking" ? "Booking.com" : bar.platform === "airbnb" ? "Airbnb" : bar.platform;
  const platformColor = bar.platform === "booking" ? "#003580" : "#ff385c";

  const formatRange = (a: string, b: string) => {
    const fmt = (s: string) =>
      new Date(s + "T12:00:00").toLocaleDateString(toBcp47(locale as Locale), {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    return `${fmt(a)} → ${fmt(b)}`;
  };

  const handleSave = async () => {
    const finalName = name.trim() || bar.defaultName || c.defaultGuestFallback;
    setSaving(true);
    try {
      await onSave(finalName);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      ref={popRef}
      className="editorial fixed z-[100] w-[300px] rounded-xl border border-[var(--line-2)] bg-[var(--bg)] shadow-2xl shadow-black/30"
      style={{ top, left }}
    >
      <div className="border-b border-[var(--line)] px-4 py-3">
        <div className="text-xs uppercase tracking-wide text-[var(--ink-4)]">
          {c.heading}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className="rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white"
            style={{ backgroundColor: platformColor }}
          >
            {platformLabel}
          </span>
          <span className="text-xs text-[var(--ink-3)]">{formatRange(bar.startDate, bar.endDate)}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs text-[var(--ink-3)] leading-snug">
          {c.body}
        </p>
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)] mb-1.5">
            {c.guestNameLabel}
          </label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={bar.defaultName || c.guestNamePlaceholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
            className="h-9 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-3 text-sm text-[var(--ink)] placeholder-[var(--ink-4)] outline-none focus:border-[var(--m-accent)] focus:ring-1 focus:ring-[var(--m-accent)]/20"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] px-3 py-2.5">
        <button
          onClick={onClose}
          disabled={saving}
          className="rounded-md px-3 py-1.5 text-sm text-[var(--ink-2)] hover:bg-[var(--bg-3)] transition-colors disabled:opacity-50"
        >
          {t("common.cancel") || c.cancel}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-[var(--m-accent)] px-3.5 py-1.5 text-sm font-medium text-white hover:bg-[var(--m-accent-2)] transition-colors disabled:opacity-50"
        >
          {saving ? c.saving : c.save}
        </button>
      </div>
    </div>,
    document.body
  );
}
