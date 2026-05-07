"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface Shortcut {
  keys: string[];
  description: Record<Locale, string>;
}

interface CopyShape {
  title: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: { title: "Keyboard shortcuts" },
  ru: { title: "Горячие клавиши" },
  de: { title: "Tastenkürzel" },
  fr: { title: "Raccourcis clavier" },
  es: { title: "Atajos de teclado" },
};

const SHORTCUTS: Shortcut[] = [
  {
    keys: ["?"],
    description: {
      en: "Show this shortcut overlay",
      ru: "Показать справку по горячим клавишам",
      de: "Tastenkürzel-Übersicht anzeigen",
      fr: "Afficher l’aide des raccourcis",
      es: "Mostrar esta ayuda de atajos",
    },
  },
  {
    keys: ["⌘", "K"],
    description: { en: "Open guest search", ru: "Поиск гостей", de: "Gästesuche öffnen", fr: "Ouvrir la recherche de voyageurs", es: "Abrir búsqueda de huéspedes" },
  },
  {
    keys: ["←"],
    description: {
      en: "Previous month (calendar)",
      ru: "Предыдущий месяц (календарь)",
      de: "Vorheriger Monat (Kalender)",
      fr: "Mois précédent (calendrier)",
      es: "Mes anterior (calendario)",
    },
  },
  {
    keys: ["→"],
    description: {
      en: "Next month (calendar)",
      ru: "Следующий месяц (календарь)",
      de: "Nächster Monat (Kalender)",
      fr: "Mois suivant (calendrier)",
      es: "Mes siguiente (calendario)",
    },
  },
  {
    keys: ["T"],
    description: { en: "Jump to today (calendar)", ru: "К сегодня (календарь)", de: "Zu heute springen (Kalender)", fr: "Aller à aujourd’hui (calendrier)", es: "Ir a hoy (calendario)" },
  },
  {
    keys: ["E"],
    description: {
      en: "Toggle Edit Dates mode (calendar)",
      ru: "Переключить режим редактирования дат (календарь)",
      de: "Datums-Bearbeitungsmodus umschalten (Kalender)",
      fr: "Activer le mode Édition des dates (calendrier)",
      es: "Activar el modo Editar fechas (calendario)",
    },
  },
  {
    keys: ["Esc"],
    description: { en: "Close overlay", ru: "Закрыть окно", de: "Fenster schließen", fr: "Fermer la fenêtre", es: "Cerrar ventana" },
  },
];

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (t.isContentEditable) return true;
  return false;
}

export function KeyboardShortcuts() {
  const { locale } = useI18n();
  const t = COPY[locale];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        return;
      }
      if (isTypingTarget(e.target)) return;
      // Use Shift+/ which produces "?" on standard layouts.
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[var(--line)] bg-[var(--bg-2)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--ink)]">
            {t.title}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-[var(--ink-4)] hover:bg-[var(--line-2)] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className="divide-y divide-[#27272b]">
          {SHORTCUTS.map((s, i) => (
            <li key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
              <span className="text-[var(--ink-2)]">{s.description[locale]}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 py-0.5 font-mono text-[11px] text-[var(--ink)]"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
