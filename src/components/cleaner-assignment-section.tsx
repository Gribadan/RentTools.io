"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

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
    <div className="rounded-lg border border-[#27272b] bg-[#18181b] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[#e8e8ec]">
        {locale === "ru" ? "Уборщики" : "Cleaners"}
      </h3>

      {loading ? (
        <div className="text-xs text-[#71717a]">…</div>
      ) : (
        <>
          {assignments.length > 0 ? (
            <ul className="mb-3 space-y-1.5">
              {assignments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-md border border-[#27272b] bg-[#111113] px-3 py-1.5 text-xs"
                >
                  <span className="text-[#e8e8ec]">{a.username}</span>
                  <button
                    onClick={() => remove(a.id)}
                    disabled={busy}
                    className="text-[#ef4444] hover:underline disabled:opacity-50"
                  >
                    {locale === "ru" ? "Убрать" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-xs text-[#71717a]">
              {locale === "ru"
                ? "Уборщики ещё не назначены."
                : "No cleaners assigned yet."}
            </p>
          )}

          <div className="flex gap-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={available.length === 0 || busy}
              className="h-8 flex-1 rounded-md border border-[#333338] bg-[#111113] px-2 text-xs text-[#e8e8ec] outline-none focus:border-[#e8e8ec] disabled:opacity-50"
            >
              <option value="">
                {available.length === 0
                  ? locale === "ru"
                    ? "Нет доступных уборщиков"
                    : "No cleaner accounts available"
                  : locale === "ru"
                  ? "Выберите уборщика…"
                  : "Select a cleaner…"}
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
              className="rounded-md bg-[#ff385c] px-3 text-xs text-white hover:bg-[#e0294d] disabled:opacity-50"
            >
              {locale === "ru" ? "Добавить" : "Add"}
            </button>
          </div>

          {error && <p className="mt-2 text-xs text-[#ef4444]">{error}</p>}
        </>
      )}
    </div>
  );
}
