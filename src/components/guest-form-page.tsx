"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Dedicated pre-arrival guest-form builder. Reached at
// /dashboard?property=<id>&view=guest-form — linked from Sync settings.
// Left: the field constructor. Right: a live preview of exactly what
// the guest sees when they open the share link.

type FieldType =
  | "short-text"
  | "long-text"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "time"
  | "select"
  | "multi-select"
  | "yes-no";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  helpText?: string;
  required: boolean;
  options?: string[];
}

const FIELD_TYPES: { type: FieldType; label: string; hint: string }[] = [
  { type: "short-text", label: "Short text", hint: "One-line answer" },
  { type: "long-text", label: "Paragraph", hint: "Multi-line answer" },
  { type: "email", label: "Email", hint: "Email address" },
  { type: "phone", label: "Phone", hint: "Phone number" },
  { type: "number", label: "Number", hint: "Numeric value" },
  { type: "date", label: "Date", hint: "Date picker" },
  { type: "time", label: "Time", hint: "Time picker" },
  { type: "select", label: "Dropdown", hint: "Pick one option" },
  { type: "multi-select", label: "Checkboxes", hint: "Pick several" },
  { type: "yes-no", label: "Yes / No", hint: "Either/or answer" },
];

const TYPE_LABEL = Object.fromEntries(
  FIELD_TYPES.map((t) => [t.type, t.label]),
) as Record<FieldType, string>;

const WITH_OPTIONS: ReadonlySet<FieldType> = new Set(["select", "multi-select"]);

// The questions hosts ask most often — offered as one-tap presets so a
// new form can be assembled in seconds with the right field type.
const SUGGESTED: { label: string; type: FieldType; options?: string[] }[] = [
  { label: "What time do you expect to arrive?", type: "time" },
  { label: "Estimated departure time", type: "time" },
  { label: "How many guests are staying?", type: "number" },
  { label: "Lead guest full name (as on passport / ID)", type: "short-text" },
  { label: "Passport / ID number", type: "short-text" },
  { label: "Nationality", type: "short-text" },
  { label: "Date of birth", type: "date" },
  { label: "Contact phone number", type: "phone" },
  { label: "Contact email", type: "email" },
  { label: "How will you travel here?", type: "select", options: ["Car", "Train", "Plane", "Other"] },
  { label: "Do you need a parking space?", type: "yes-no" },
  { label: "Any special requests or questions?", type: "long-text" },
];

function freshId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function newField(type: FieldType): FormField {
  const f: FormField = { id: freshId(), type, label: "", required: false };
  if (WITH_OPTIONS.has(type)) f.options = ["Option 1", "Option 2"];
  return f;
}

export function GuestFormPage({
  propertyId,
  propertyName,
}: {
  propertyId: number;
  propertyName: string;
}) {
  const [name, setName] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/properties/${propertyId}/guest-form`);
        if (!res.ok || cancelled) return;
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

  const patchField = (id: string, patch: Partial<FormField>) =>
    setFields((arr) => arr.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const addField = (type: FieldType) => {
    setFields((arr) => [...arr, newField(type)]);
    setAddOpen(false);
  };

  const addSuggested = (s: (typeof SUGGESTED)[number]) => {
    const f: FormField = { id: freshId(), type: s.type, label: s.label, required: false };
    if (s.options) f.options = [...s.options];
    setFields((arr) => [...arr, f]);
  };

  const removeField = (id: string) =>
    setFields((arr) => arr.filter((f) => f.id !== id));

  const duplicateField = (id: string) =>
    setFields((arr) => {
      const idx = arr.findIndex((f) => f.id === id);
      if (idx < 0) return arr;
      const copy: FormField = { ...arr[idx], id: freshId() };
      if (copy.options) copy.options = [...copy.options];
      const out = arr.slice();
      out.splice(idx + 1, 0, copy);
      return out;
    });

  // Reorder: drop the dragged field directly before the target field.
  const reorder = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setFields((arr) => {
      const from = arr.findIndex((f) => f.id === sourceId);
      const to = arr.findIndex((f) => f.id === targetId);
      if (from < 0 || to < 0) return arr;
      const out = arr.slice();
      const [moved] = out.splice(from, 1);
      out.splice(out.findIndex((f) => f.id === targetId), 0, moved);
      return out;
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}/guest-form`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, fields }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Couldn't save the form");
        return;
      }
      setSavedAt(Date.now());
    } catch {
      setError("Couldn't save the form");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[1760px] space-y-5 px-3 sm:px-5">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/dashboard?property=${propertyId}&view=sync`}
              className="inline-flex items-center gap-1 text-xs text-[var(--ink-3)] transition-colors hover:text-[var(--ink)]"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Sync settings
            </Link>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-[var(--ink)]">
              Pre-arrival guest form
            </h1>
            <p className="mt-0.5 text-xs text-[var(--ink-3)]">
              {propertyName} · build the form once, then share a link per reservation
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savedAt && !error && (
              <span className="text-xs text-emerald-500">Saved</span>
            )}
            {error && <span className="text-xs text-rose-500">{error}</span>}
            <button
              type="button"
              onClick={save}
              disabled={saving || loading}
              className="rounded-lg bg-[var(--m-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save form"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--ink-4)]">Loading…</p>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Builder */}
            <div className="min-w-0 space-y-4 lg:flex-1">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4">
                <label className="block text-xs font-medium text-[var(--ink-3)]">
                  Form title
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Pre-arrival questions"
                  className="mt-1.5 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 py-2 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                />
              </div>

              {/* Suggested questions — one-tap presets with the right
                  field type. An already-added one (matched by label)
                  shows a check and is disabled. */}
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-4)]">
                  Suggested questions
                </h3>
                <p className="mt-0.5 text-xs text-[var(--ink-4)]">
                  Tap to add a common question — already typed for you.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {SUGGESTED.map((s) => {
                    const added = fields.some(
                      (f) => f.label.trim().toLowerCase() === s.label.toLowerCase(),
                    );
                    return (
                      <button
                        key={s.label}
                        type="button"
                        disabled={added}
                        onClick={() => addSuggested(s)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          added
                            ? "cursor-default border-[var(--line)] text-[var(--ink-4)]"
                            : "border-[var(--line-2)] text-[var(--ink-2)] hover:border-[var(--m-accent)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {added ? "✓ " : "+ "}
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {fields.length === 0 && (
                <div className="rounded-xl border border-dashed border-[var(--line-2)] px-4 py-8 text-center">
                  <p className="text-sm text-[var(--ink-3)]">No questions yet.</p>
                  <p className="mt-0.5 text-xs text-[var(--ink-4)]">
                    Tap a suggestion above, or add a custom field below.
                  </p>
                </div>
              )}

              {fields.map((f, i) => (
                <div
                  key={f.id}
                  onDragOver={(e) => {
                    if (dragId) e.preventDefault();
                  }}
                  onDrop={() => {
                    if (dragId) reorder(dragId, f.id);
                    setDragId(null);
                  }}
                  className={`rounded-xl border bg-[var(--bg-2)] p-4 transition-colors ${
                    dragId === f.id
                      ? "border-[var(--m-accent)] opacity-50"
                      : "border-[var(--line)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      draggable
                      onDragStart={() => setDragId(f.id)}
                      onDragEnd={() => setDragId(null)}
                      title="Drag to reorder"
                      className="cursor-grab select-none rounded p-1 text-[var(--ink-4)] hover:bg-[var(--bg-3)] hover:text-[var(--ink-2)] active:cursor-grabbing"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
                        <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
                        <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
                      </svg>
                    </span>
                    <span className="rounded bg-[var(--bg-3)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
                      {TYPE_LABEL[f.type]}
                    </span>
                    <span className="text-[11px] text-[var(--ink-4)]">#{i + 1}</span>
                    <div className="ml-auto flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => duplicateField(f.id)}
                        aria-label="Duplicate field"
                        title="Duplicate"
                        className="rounded p-1.5 text-[var(--ink-4)] hover:bg-[var(--bg-3)] hover:text-[var(--ink-2)]"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m11.25 4.125v3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeField(f.id)}
                        aria-label="Remove field"
                        title="Remove"
                        className="rounded p-1.5 text-[var(--ink-4)] hover:bg-rose-500/10 hover:text-rose-500"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <input
                    value={f.label}
                    onChange={(e) => patchField(f.id, { label: e.target.value })}
                    placeholder="Question label — e.g. What time will you arrive?"
                    className="mt-3 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                  />
                  <input
                    value={f.helpText ?? ""}
                    onChange={(e) => patchField(f.id, { helpText: e.target.value })}
                    placeholder="Help text (optional) — extra guidance shown under the question"
                    className="mt-2 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--ink-2)] outline-none focus:border-[var(--ink)]"
                  />

                  {WITH_OPTIONS.has(f.type) && (
                    <div className="mt-2">
                      <label className="text-[11px] font-medium text-[var(--ink-4)]">
                        Options — one per line
                      </label>
                      <textarea
                        value={(f.options ?? []).join("\n")}
                        onChange={(e) =>
                          patchField(f.id, {
                            options: e.target.value.split("\n").map((s) => s.replace(/^\s+/, "")),
                          })
                        }
                        onBlur={(e) =>
                          patchField(f.id, {
                            options: e.target.value
                              .split("\n")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        rows={3}
                        className="mt-1 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                      />
                    </div>
                  )}

                  <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-xs text-[var(--ink-3)]">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => patchField(f.id, { required: e.target.checked })}
                      className="h-3.5 w-3.5 accent-[var(--m-accent)]"
                    />
                    Required
                  </label>
                </div>
              ))}

              {/* Add field */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAddOpen((v) => !v)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--line-2)] py-3 text-sm font-medium text-[var(--ink-3)] transition-colors hover:border-[var(--m-accent)] hover:text-[var(--ink)]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add a question
                </button>
                {addOpen && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-2 sm:grid-cols-3">
                    {FIELD_TYPES.map((ft) => (
                      <button
                        key={ft.type}
                        type="button"
                        onClick={() => addField(ft.type)}
                        className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-left transition-colors hover:border-[var(--m-accent)] hover:bg-[var(--bg-3)]"
                      >
                        <span className="block text-xs font-medium text-[var(--ink)]">
                          {ft.label}
                        </span>
                        <span className="block text-[10px] text-[var(--ink-4)]">
                          {ft.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live preview */}
            <aside className="w-full lg:w-[440px] lg:shrink-0">
              <div className="lg:sticky lg:top-3">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                  Guest preview
                </p>
                <FormPreview name={name} fields={fields} propertyName={propertyName} />
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

// Renders the form the way the guest sees it on the public share page
// (the dark, standalone /g/<token> screen) so the host previews the
// real result while editing.
function FormPreview({
  name,
  fields,
  propertyName,
}: {
  name: string;
  fields: FormField[];
  propertyName: string;
}) {
  const inputCls =
    "mt-1.5 w-full rounded-md border border-[#1e2329] bg-[#161b22] px-3 py-2 text-sm text-[#e8e8ec]";

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)]">
      <div className="bg-[#0d1117] px-5 py-6">
        <p className="text-[10px] uppercase tracking-wider text-[#a0a0a8]">
          {propertyName}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-[#e8e8ec]">
          {name || "Pre-arrival form"}
        </h2>
        <p className="mt-1 text-xs text-[#a0a0a8]">
          Please answer a few questions before your stay.
        </p>

        <div className="mt-5 space-y-4">
          {fields.length === 0 && (
            <p className="rounded-md border border-dashed border-[#1e2329] px-3 py-6 text-center text-xs text-[#6b7280]">
              Your questions will appear here.
            </p>
          )}
          {fields.map((f) => (
            <div key={f.id}>
              <span className="block text-sm font-medium text-[#e8e8ec]">
                {f.label || "Untitled question"}
                {f.required && <span className="ml-1 text-[#ff385c]">*</span>}
              </span>
              {f.helpText && (
                <span className="mt-0.5 block text-xs text-[#a0a0a8]">{f.helpText}</span>
              )}
              {f.type === "long-text" ? (
                <textarea rows={3} disabled className={inputCls} />
              ) : f.type === "yes-no" ? (
                <div className="mt-1.5 flex gap-2">
                  {["Yes", "No"].map((o) => (
                    <span
                      key={o}
                      className="flex-1 rounded-md border border-[#1e2329] bg-[#161b22] px-3 py-2 text-center text-sm text-[#e8e8ec]"
                    >
                      {o}
                    </span>
                  ))}
                </div>
              ) : f.type === "select" ? (
                <select disabled className={inputCls}>
                  <option>— select —</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : f.type === "multi-select" ? (
                <div className="mt-1.5 space-y-1.5">
                  {(f.options ?? []).length === 0 && (
                    <span className="text-xs text-[#6b7280]">No options yet</span>
                  )}
                  {(f.options ?? []).map((o) => (
                    <span
                      key={o}
                      className="flex items-center gap-2 rounded-md border border-[#1e2329] bg-[#161b22] px-3 py-1.5 text-sm text-[#e8e8ec]"
                    >
                      <span className="h-3.5 w-3.5 rounded-sm border border-[#3a3f47]" />
                      {o}
                    </span>
                  ))}
                </div>
              ) : (
                <input
                  type={
                    f.type === "number"
                      ? "number"
                      : f.type === "date"
                        ? "date"
                        : f.type === "time"
                          ? "time"
                          : f.type === "email"
                            ? "email"
                            : f.type === "phone"
                              ? "tel"
                              : "text"
                  }
                  disabled
                  className={inputCls}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-md bg-[#ff385c] px-4 py-2.5 text-center text-sm font-medium text-white">
          Submit
        </div>
      </div>
    </div>
  );
}
