"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface CopyShape {
  default: string;
  firstBackup: string;
  secondBackup: string;
  nthBackup: (rank: number) => string;
  failed: string;
  cleaners: string;
  add: string;
  emptyState: string;
  legacyLogin: string;
  moveUp: string;
  moveDown: string;
  remove: string;
  poolEmpty: string;
  pickFromPool: string;
  createNew: string;
  cancel: string;
  addBtn: string;
  namePlaceholder: string;
  phonePlaceholder: string;
  back: string;
  createAndAdd: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    default: "Default",
    firstBackup: "1st backup",
    secondBackup: "2nd backup",
    nthBackup: (rank) => `${rank}th backup`,
    failed: "Failed",
    cleaners: "Cleaners",
    add: "+ Add",
    emptyState: "No one assigned. Add a default and optional backups.",
    legacyLogin: "Legacy login",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove",
    poolEmpty: "All pool cleaners already assigned",
    pickFromPool: "Pick from your pool…",
    createNew: "+ Create new",
    cancel: "Cancel",
    addBtn: "Add",
    namePlaceholder: "Name",
    phonePlaceholder: "Phone (optional)",
    back: "Back",
    createAndAdd: "Create & add",
  },
  ru: {
    default: "Основной",
    firstBackup: "1-й резерв",
    secondBackup: "2-й резерв",
    nthBackup: (rank) => `${rank}-й резерв`,
    failed: "Не удалось",
    cleaners: "Уборщики",
    add: "+ Добавить",
    emptyState: "Никто не назначен. Добавьте основного и при желании резервных.",
    legacyLogin: "Унаследовано",
    moveUp: "Поднять",
    moveDown: "Опустить",
    remove: "Убрать",
    poolEmpty: "Все уборщики из пула уже добавлены",
    pickFromPool: "Выберите из пула…",
    createNew: "+ Создать нового",
    cancel: "Отмена",
    addBtn: "Добавить",
    namePlaceholder: "Имя",
    phonePlaceholder: "Телефон (необязательно)",
    back: "Назад",
    createAndAdd: "Создать и добавить",
  },
  de: {
    default: "Standard",
    firstBackup: "1. Backup",
    secondBackup: "2. Backup",
    nthBackup: (rank) => `${rank}. Backup`,
    failed: "Fehlgeschlagen",
    cleaners: "Reinigungskräfte",
    add: "+ Hinzufügen",
    emptyState: "Niemand zugewiesen. Fügen Sie eine Standard-Reinigungskraft und optional Backups hinzu.",
    legacyLogin: "Alt-Login",
    moveUp: "Nach oben",
    moveDown: "Nach unten",
    remove: "Entfernen",
    poolEmpty: "Alle Pool-Reinigungskräfte sind bereits zugewiesen",
    pickFromPool: "Aus Pool wählen…",
    createNew: "+ Neu anlegen",
    cancel: "Abbrechen",
    addBtn: "Hinzufügen",
    namePlaceholder: "Name",
    phonePlaceholder: "Telefon (optional)",
    back: "Zurück",
    createAndAdd: "Anlegen und hinzufügen",
  },
};

// RT-25.10 tick 2 — per-property Cleaners assignment panel rendered in the
// PropertyCleaningView sidebar. Pulls from the account-level Cleaner pool
// (/api/cleaners) and the per-property assignments (/api/cleaner-
// assignments?propertyId=X). Lets the host:
//   - rank assigned cleaners (priority asc; 0 = default, 1 = first backup, …)
//   - reorder via ↑ / ↓ (PATCH /api/cleaner-assignments/[id] { priority })
//   - remove (DELETE)
//   - add from the pool, with an inline "Create new cleaner" form
//
// Profile-only flow per maintainer decision: cleaners are not given login
// access from this surface. Pre-existing role='cleaner' Users still appear
// (legacy "username" shape from /api/cleaner-assignments) so historic
// assignments survive the migration; they show up alongside profiles and
// can be removed but not reordered until they're paired with a profile.

interface Assignment {
  id: number;
  cleanerProfileId: number | null;
  cleanerId: number | null;
  cleanerName: string | null;
  cleanerPhone: string | null;
  username: string | null;
  priority: number;
}

interface Pool {
  id: number;
  name: string;
  phone: string | null;
}

interface CleanersPanelProps {
  propertyId: number;
}

export function CleanersPanel({ propertyId }: CleanersPanelProps) {
  const { locale } = useI18n();
  const c = COPY[locale];
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pool, setPool] = useState<Pool[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add-form state
  const [showAdd, setShowAdd] = useState(false);
  const [pickedProfileId, setPickedProfileId] = useState<string>("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const refresh = async () => {
    try {
      const [aRes, pRes] = await Promise.all([
        fetch(`/api/cleaner-assignments?propertyId=${propertyId}`),
        fetch(`/api/cleaners`),
      ]);
      if (aRes.ok) setAssignments(await aRes.json());
      if (pRes.ok) setPool(await pRes.json());
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const assignedProfileIds = new Set(
    assignments.map((a) => a.cleanerProfileId).filter((id): id is number => id !== null),
  );
  const availablePool = pool.filter((p) => !assignedProfileIds.has(p.id));

  const nextPriority =
    assignments.length === 0
      ? 0
      : Math.max(...assignments.map((a) => a.priority)) + 1;

  const priorityLabel = (rank: number): string => {
    if (rank === 0) return c.default;
    if (rank === 1) return c.firstBackup;
    if (rank === 2) return c.secondBackup;
    return c.nthBackup(rank);
  };

  const addProfile = async (profileId: number) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cleaner-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          cleanerProfileId: profileId,
          priority: nextPriority,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || c.failed);
        return;
      }
      setShowAdd(false);
      setPickedProfileId("");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleAddPicked = async () => {
    const idNum = Number.parseInt(pickedProfileId, 10);
    if (Number.isNaN(idNum)) return;
    await addProfile(idNum);
  };

  const handleCreateAndAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cleaners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: newPhone.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || c.failed);
        setBusy(false);
        return;
      }
      const profile = (await res.json()) as Pool;
      setNewName("");
      setNewPhone("");
      setCreatingNew(false);
      // addProfile will refresh and clear busy
      await addProfile(profile.id);
    } catch {
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

  const setPriority = async (id: number, priority: number) => {
    setBusy(true);
    try {
      await fetch(`/api/cleaner-assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  // Swap by index in the priority-asc array. Two PATCH calls: a→b, b→a.
  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= assignments.length) return;
    const a = assignments[idx];
    const b = assignments[target];
    setBusy(true);
    try {
      await fetch(`/api/cleaner-assignments/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: b.priority }),
      });
      await fetch(`/api/cleaner-assignments/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: a.priority }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-[var(--line)] px-5 py-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
          {c.cleaners}
        </div>
        {!showAdd && loaded && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            disabled={busy}
            className="text-xs text-[var(--m-accent)] hover:underline disabled:opacity-50"
          >
            {c.add}
          </button>
        )}
      </div>

      {!loaded ? (
        <div className="text-xs text-[var(--ink-4)]">…</div>
      ) : (
        <>
          {assignments.length === 0 ? (
            <p className="text-xs text-[var(--ink-3)] leading-relaxed">
              {c.emptyState}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {assignments.map((a, idx) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="truncate text-sm font-medium text-[var(--ink)]">
                        {a.cleanerName || a.username || "—"}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-[var(--ink-4)]">
                        {priorityLabel(idx)}
                      </span>
                    </div>
                    {a.cleanerPhone && (
                      <div className="text-[11px] text-[var(--ink-4)] truncate">
                        {a.cleanerPhone}
                      </div>
                    )}
                    {a.username && !a.cleanerProfileId && (
                      <div className="text-[10px] text-[var(--ink-4)] italic">
                        {c.legacyLogin}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={busy || idx === 0 || !a.cleanerProfileId}
                      title={c.moveUp}
                      className="flex h-6 w-6 items-center justify-center rounded text-[var(--ink-3)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)] disabled:opacity-30"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={busy || idx === assignments.length - 1 || !a.cleanerProfileId}
                      title={c.moveDown}
                      className="flex h-6 w-6 items-center justify-center rounded text-[var(--ink-3)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)] disabled:opacity-30"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(a.id)}
                      disabled={busy}
                      title={c.remove}
                      className="flex h-6 w-6 items-center justify-center rounded text-rose-500 hover:bg-rose-500/10 disabled:opacity-30"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
              {/* Manual priority normalisation hint when ordering is uneven —
                  the priority field tolerates gaps but the UI sets new
                  priorities to N+1 which keeps it sane. */}
            </ul>
          )}

          {showAdd && (
            <div className="mt-3 rounded-md border border-[var(--line-2)] bg-[var(--bg)] p-3 space-y-2">
              {!creatingNew ? (
                <>
                  <select
                    value={pickedProfileId}
                    onChange={(e) => setPickedProfileId(e.target.value)}
                    disabled={busy}
                    className="h-8 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)] disabled:opacity-50"
                  >
                    <option value="">
                      {availablePool.length === 0 ? c.poolEmpty : c.pickFromPool}
                    </option>
                    {availablePool.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.phone ? ` · ${p.phone}` : ""}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setCreatingNew(true)}
                      disabled={busy}
                      className="text-xs text-[var(--m-accent)] hover:underline disabled:opacity-50"
                    >
                      {c.createNew}
                    </button>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdd(false);
                          setPickedProfileId("");
                          setError(null);
                        }}
                        disabled={busy}
                        className="rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-2.5 py-1 text-xs text-[var(--ink-2)] hover:bg-[var(--bg-3)] disabled:opacity-50"
                      >
                        {c.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={handleAddPicked}
                        disabled={busy || !pickedProfileId}
                        className="rounded-md bg-[var(--m-accent)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--m-accent-2)] disabled:opacity-50"
                      >
                        {c.addBtn}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={c.namePlaceholder}
                    disabled={busy}
                    className="h-8 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)] disabled:opacity-50"
                  />
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder={c.phonePlaceholder}
                    disabled={busy}
                    className="h-8 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)] disabled:opacity-50"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCreatingNew(false);
                        setNewName("");
                        setNewPhone("");
                      }}
                      disabled={busy}
                      className="rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-2.5 py-1 text-xs text-[var(--ink-2)] hover:bg-[var(--bg-3)] disabled:opacity-50"
                    >
                      {c.back}
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateAndAdd}
                      disabled={busy || !newName.trim()}
                      className="rounded-md bg-[var(--m-accent)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--m-accent-2)] disabled:opacity-50"
                    >
                      {c.createAndAdd}
                    </button>
                  </div>
                </>
              )}
              {error && <p className="text-xs text-rose-500">{error}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
