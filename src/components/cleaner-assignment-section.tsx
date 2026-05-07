"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface CopyShape {
  cleaners: string;
  remove: string;
  noneAssigned: string;
  noneAvailable: string;
  selectCleaner: string;
  add: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    cleaners: "Cleaners",
    remove: "Remove",
    noneAssigned: "No cleaners assigned yet.",
    noneAvailable: "No cleaner accounts available",
    selectCleaner: "Select a cleaner…",
    add: "Add",
  },
  ru: {
    cleaners: "Уборщики",
    remove: "Убрать",
    noneAssigned: "Уборщики ещё не назначены.",
    noneAvailable: "Нет доступных уборщиков",
    selectCleaner: "Выберите уборщика…",
    add: "Добавить",
  },
  de: {
    cleaners: "Reinigungskräfte",
    remove: "Entfernen",
    noneAssigned: "Noch keine Reinigungskräfte zugewiesen.",
    noneAvailable: "Keine Reinigungskraft-Konten verfügbar",
    selectCleaner: "Reinigungskraft auswählen…",
    add: "Hinzufügen",
  },
  fr: {
    cleaners: "Agents de ménage",
    remove: "Retirer",
    noneAssigned: "Aucun agent de ménage assigné.",
    noneAvailable: "Aucun compte d’agent de ménage disponible",
    selectCleaner: "Choisir un agent de ménage…",
    add: "Ajouter",
  },
};

interface Assignment {
  id: number;
  cleanerId: number;
  username: string;
  createdAt: string;
}

interface CleanerOption {
  id: number;
  username: string;
}

interface CleanerAssignmentSectionProps {
  propertyId: number;
}

export function CleanerAssignmentSection({ propertyId }: CleanerAssignmentSectionProps) {
  const { locale } = useI18n();
  const t = COPY[locale];
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [cleaners, setCleaners] = useState<CleanerOption[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [aRes, uRes] = await Promise.all([
        fetch(`/api/cleaner-assignments?propertyId=${propertyId}`),
        fetch(`/api/users?role=cleaner`),
      ]);
      if (aRes.ok) setAssignments(await aRes.json());
      if (uRes.ok) {
        const all = (await uRes.json()) as CleanerOption[];
        setCleaners(Array.isArray(all) ? all : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [propertyId]);

  const assignedIds = new Set(assignments.map((a) => a.cleanerId));
  const available = cleaners.filter((c) => !assignedIds.has(c.id));

  const add = async () => {
    if (!selected) return;
    const cleaner = cleaners.find((c) => String(c.id) === selected);
    if (!cleaner) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cleaner-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, username: cleaner.username }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed");
        return;
      }
      setSelected("");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    setBusy(true);
    try {
      await fetch(`/api/cleaner-assignments/${id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">
        {t.cleaners}
      </h3>

      {loading ? (
        <div className="text-xs text-[var(--ink-4)]">…</div>
      ) : (
        <>
          {assignments.length > 0 ? (
            <ul className="mb-3 space-y-1.5">
              {assignments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 text-xs"
                >
                  <span className="text-[var(--ink)]">{a.username}</span>
                  <button
                    onClick={() => remove(a.id)}
                    disabled={busy}
                    className="text-rose-500 hover:underline disabled:opacity-50"
                  >
                    {t.remove}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-xs text-[var(--ink-4)]">
              {t.noneAssigned}
            </p>
          )}

          <div className="flex gap-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={available.length === 0 || busy}
              className="h-8 flex-1 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)] disabled:opacity-50"
            >
              <option value="">
                {available.length === 0 ? t.noneAvailable : t.selectCleaner}
              </option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.username}
                </option>
              ))}
            </select>
            <button
              onClick={add}
              disabled={!selected || busy}
              className="rounded-md bg-[var(--m-accent)] px-3 text-xs text-white hover:bg-[var(--m-accent-2)] disabled:opacity-50"
            >
              {t.add}
            </button>
          </div>

          {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
        </>
      )}
    </div>
  );
}
