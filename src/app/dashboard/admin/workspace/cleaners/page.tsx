"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

// RT-25.10 tick 2 — Account-level Cleaners pool admin sub-route at
// /dashboard/admin/workspace/cleaners. CRUD for the host's named cleaner
// profiles + a per-row summary of which properties each cleaner is
// assigned to (deep-link to the property's cleaning tab where assignment
// priority is reordered). Per-property assignment lives in the Cleaning
// sidebar of each property — this page is the cross-property pool.

interface AssignmentSummary {
  propertyId: number;
  propertyName: string;
  priority: number;
}

interface CleanerRow {
  id: number;
  name: string;
  phone: string | null;
  createdAt: string;
  assignments: AssignmentSummary[];
}

export default function AdminCleanersPage() {
  const { locale } = useI18n();
  const [rows, setRows] = useState<CleanerRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Edit state — keyed by cleaner id
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const refresh = async () => {
    try {
      const res = await fetch("/api/cleaners?withAssignments=1");
      if (res.ok) {
        const data = (await res.json()) as CleanerRow[];
        setRows(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cleaners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, phone: phone.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || (locale === "ru" ? "Не удалось" : "Failed"));
        return;
      }
      setName("");
      setPhone("");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (r: CleanerRow) => {
    setEditingId(r.id);
    setEditName(r.name);
    setEditPhone(r.phone ?? "");
    setError(null);
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cleaners/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, phone: editPhone.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || (locale === "ru" ? "Не удалось" : "Failed"));
        return;
      }
      setEditingId(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    const confirmText =
      locale === "ru"
        ? "Удалить уборщика? Все назначения по объектам также будут удалены."
        : "Delete this cleaner? All property assignments will be removed too.";
    if (!confirm(confirmText)) return;
    setBusy(true);
    try {
      await fetch(`/api/cleaners/${id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const priorityLabel = (rank: number): string => {
    if (rank === 0) return locale === "ru" ? "осн." : "default";
    return locale === "ru" ? `рез. ${rank}` : `backup ${rank}`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {locale === "ru" ? "Уборщики" : "Cleaners"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Пул уборщиков на уровне аккаунта. Назначение на конкретный объект — на вкладке «Уборки» этого объекта."
            : "Account-level cleaner pool. Assign to specific properties from each property's Cleaning tab."}
        </p>
      </div>

      {/* Create */}
      <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4 space-y-3">
        <h3 className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
          {locale === "ru" ? "Добавить уборщика" : "Add cleaner"}
        </h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={locale === "ru" ? "Имя" : "Name"}
            disabled={busy}
            className="h-9 flex-1 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)] disabled:opacity-50"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={locale === "ru" ? "Телефон (необязательно)" : "Phone (optional)"}
            disabled={busy}
            className="h-9 flex-1 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)] disabled:opacity-50"
          />
          <button
            type="button"
            onClick={create}
            disabled={busy || !name.trim()}
            className="rounded-md bg-[var(--m-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--m-accent-2)] disabled:opacity-50"
          >
            {locale === "ru" ? "Добавить" : "Add"}
          </button>
        </div>
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </section>

      {/* List */}
      <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)]">
        {!loaded ? (
          <div className="px-4 py-5 text-sm text-[var(--ink-4)]">
            {locale === "ru" ? "Загрузка…" : "Loading…"}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-5 text-sm text-[var(--ink-4)]">
            {locale === "ru"
              ? "Уборщиков ещё нет. Добавьте первого выше."
              : "No cleaners yet. Add your first above."}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--line)]/60">
            {rows.map((r) => (
              <li key={r.id} className="px-4 py-3">
                {editingId === r.id ? (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={busy}
                        className="h-9 flex-1 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)] disabled:opacity-50"
                      />
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder={locale === "ru" ? "Телефон" : "Phone"}
                        disabled={busy}
                        className="h-9 flex-1 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)] disabled:opacity-50"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={busy}
                        className="rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--ink-2)] hover:bg-[var(--bg-3)] disabled:opacity-50"
                      >
                        {locale === "ru" ? "Отмена" : "Cancel"}
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={busy || !editName.trim()}
                        className="rounded-md bg-[var(--m-accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--m-accent-2)] disabled:opacity-50"
                      >
                        {locale === "ru" ? "Сохранить" : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-[var(--ink)]">{r.name}</span>
                        {r.phone && (
                          <span className="text-xs text-[var(--ink-4)]">{r.phone}</span>
                        )}
                      </div>
                      {r.assignments.length === 0 ? (
                        <div className="mt-1 text-xs text-[var(--ink-4)] italic">
                          {locale === "ru"
                            ? "Не назначен ни одному объекту"
                            : "Not assigned to any property"}
                        </div>
                      ) : (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {r.assignments.map((a) => (
                            <Link
                              key={`${r.id}-${a.propertyId}`}
                              href={`/dashboard?property=${a.propertyId}&view=cleaning`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 py-0.5 text-[11px] text-[var(--ink-2)] hover:bg-[var(--bg-3)]"
                            >
                              <span>{a.propertyName}</span>
                              <span className="text-[10px] uppercase tracking-wide text-[var(--ink-4)]">
                                {priorityLabel(a.priority)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        disabled={busy}
                        className="rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2.5 py-1 text-xs text-[var(--ink-2)] hover:bg-[var(--bg-3)] disabled:opacity-50"
                      >
                        {locale === "ru" ? "Изменить" : "Edit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(r.id)}
                        disabled={busy}
                        className="rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2.5 py-1 text-xs text-rose-500 hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        {locale === "ru" ? "Удалить" : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
