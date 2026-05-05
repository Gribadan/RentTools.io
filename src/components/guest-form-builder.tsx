"use client";

import { useEffect, useState } from "react";

type FieldType =
  | "short-text"
  | "long-text"
  | "number"
  | "select"
  | "multi-select"
  | "date"
  | "time"
  | "yes-no"
  | "phone";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  "short-text": "Short text",
  "long-text": "Long text",
  number: "Number",
  select: "Single select",
  "multi-select": "Multi-select",
  date: "Date",
  time: "Time",
  "yes-no": "Yes / No",
  phone: "Phone",
};

const TYPES_WITH_OPTIONS: ReadonlySet<FieldType> = new Set(["select", "multi-select"]);

function newField(type: FieldType): FormField {
  const base: FormField = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    type,
    label: "",
    required: false,
  };
  if (TYPES_WITH_OPTIONS.has(type)) base.options = [];
  return base;
}

export function GuestFormBuilder({ propertyId }: { propertyId: number }) {
  const [name, setName] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/properties/${propertyId}/guest-form`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.template) {
          setName(data.template.name ?? "");
          setFields(Array.isArray(data.template.fields) ? data.template.fields : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const addField = (type: FieldType) => setFields((arr) => [...arr, newField(type)]);

  const updateField = (id: string, patch: Partial<FormField>) =>
    setFields((arr) => arr.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const removeField = (id: string) => setFields((arr) => arr.filter((f) => f.id !== id));

  const moveField = (id: string, dir: -1 | 1) =>
    setFields((arr) => {
      const idx = arr.findIndex((f) => f.id === id);
      if (idx < 0) return arr;
      const next = idx + dir;
      if (next < 0 || next >= arr.length) return arr;
      const out = arr.slice();
      const [moved] = out.splice(idx, 1);
      out.splice(next, 0, moved);
      return out;
    });

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}/guest-form`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, fields }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Save failed");
        return;
      }
      setSavedAt(Date.now());
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink)]">Pre-arrival guest form</h2>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            Build a reusable form for this property. Send a per-reservation share link to the guest;
            answers appear inside the reservation.
          </p>
        </div>
        <span className="text-[var(--ink-muted)]" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {loading ? (
            <p className="text-xs text-[var(--ink-muted)]">Loading…</p>
          ) : (
            <>
              <label className="block">
                <span className="block text-xs text-[var(--ink-muted)]">Form name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Pre-arrival questions"
                  className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                />
              </label>

              <div className="space-y-2">
                {fields.length === 0 && (
                  <p className="rounded-md border border-dashed border-[var(--line)] px-3 py-4 text-center text-xs text-[var(--ink-muted)]">
                    No fields yet. Add one below.
                  </p>
                )}
                {fields.map((f, i) => (
                  <div
                    key={f.id}
                    className="rounded-md border border-[var(--line)] bg-[var(--bg)] p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[var(--bg-2)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
                        {FIELD_TYPE_LABELS[f.type]}
                      </span>
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveField(f.id, -1)}
                          disabled={i === 0}
                          aria-label="Move up"
                          className="rounded p-1 text-[var(--ink-muted)] hover:bg-[var(--bg-2)] disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(f.id, 1)}
                          disabled={i === fields.length - 1}
                          aria-label="Move down"
                          className="rounded p-1 text-[var(--ink-muted)] hover:bg-[var(--bg-2)] disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeField(f.id)}
                          aria-label="Remove field"
                          className="rounded p-1 text-rose-400 hover:bg-rose-500/10"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => updateField(f.id, { label: e.target.value })}
                      placeholder="Question label (e.g. What time will you arrive?)"
                      className="w-full rounded border border-[var(--line)] bg-[var(--bg-2)] px-2 py-1.5 text-sm text-[var(--ink)]"
                    />

                    {TYPES_WITH_OPTIONS.has(f.type) && (
                      <textarea
                        value={(f.options ?? []).join("\n")}
                        onChange={(e) =>
                          updateField(f.id, {
                            options: e.target.value
                              .split("\n")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="One option per line"
                        rows={3}
                        className="w-full rounded border border-[var(--line)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--ink)]"
                      />
                    )}

                    <label className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => updateField(f.id, { required: e.target.checked })}
                      />
                      Required
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addField(type)}
                    className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1 text-xs text-[var(--ink)] hover:bg-[var(--bg-2)]"
                  >
                    + {FIELD_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={save}
                  disabled={busy}
                  className="rounded-md bg-[#ff385c] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save form"}
                </button>
                {error && <span className="text-xs text-rose-400">{error}</span>}
                {!error && savedAt && (
                  <span className="text-xs text-emerald-400">Saved</span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
