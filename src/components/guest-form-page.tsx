"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  GUEST_FORM_LOCALES,
  GUEST_UI_COPY,
  LOCALE_NATIVE_NAME,
  availableLocales,
  resolveField,
  resolveName,
  type GuestFormI18n,
  type GuestFormLocale,
} from "@/lib/guest-form-i18n";

// Dedicated pre-arrival guest-form builder. Reached at
// /dashboard?property=<id>&view=guest-form — linked from Sync settings.
// Left: the field constructor. Right: a live preview of exactly what
// the guest sees when they open the share link.
//
// English is the base language. The language tabs let the host
// optionally translate the form into the other four app locales — in a
// translation tab the form structure is locked and only the text gets
// a per-language override. The guest then picks their language on the
// public share page; anything left blank falls back to English.

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
  const [i18n, setI18n] = useState<GuestFormI18n>({});
  const [activeLang, setActiveLang] = useState<GuestFormLocale>("en");
  const [loading, setLoading] = useState(true);
  // Auto-save status chip. The previous "Save form" button was easy to
  // miss — hosts hit the preview's Submit (which does nothing) and lost
  // their work. Edits now persist on their own ~600ms after the last
  // keystroke / toggle, with this chip as the visible receipt.
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [dragId, setDragId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  // Last value the server confirmed. We compare current state against
  // this to decide whether there's anything to save, so a no-op edit
  // (toggle then untoggle) doesn't trigger a network round-trip.
  const lastSavedRef = useRef<{ name: string; fields: FormField[]; i18n: GuestFormI18n } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/properties/${propertyId}/guest-form`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        const loadedName = data.template?.name ?? "";
        const loadedFields = Array.isArray(data.template?.fields)
          ? (data.template.fields as FormField[])
          : [];
        const loadedI18n =
          data.template?.i18n && typeof data.template.i18n === "object"
            ? (data.template.i18n as GuestFormI18n)
            : {};
        setName(loadedName);
        setFields(loadedFields);
        setI18n(loadedI18n);
        // Snapshot what the server already holds so the auto-save
        // effect doesn't fire on the initial load.
        lastSavedRef.current = {
          name: loadedName,
          fields: loadedFields,
          i18n: loadedI18n,
        };
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  // Auto-save: ~600ms after the last edit, push the current name +
  // fields + i18n. Skipped while the initial load is in flight, and
  // skipped when nothing has actually changed against lastSavedRef.
  useEffect(() => {
    if (loading || !lastSavedRef.current) return;
    const last = lastSavedRef.current;
    const unchanged =
      last.name === name &&
      JSON.stringify(last.fields) === JSON.stringify(fields) &&
      JSON.stringify(last.i18n) === JSON.stringify(i18n);
    if (unchanged) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/properties/${propertyId}/guest-form`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, fields, i18n }),
        });
        if (!res.ok) {
          setSaveState("error");
          return;
        }
        // Snapshot the values we just sent (not whatever fresh edits
        // the host has already made in the meantime) — the next render
        // pass will compare and trigger another save if needed.
        lastSavedRef.current = { name, fields, i18n };
        setSaveState("saved");
        setTimeout(
          () => setSaveState((s) => (s === "saved" ? "idle" : s)),
          1600,
        );
      } catch {
        setSaveState("error");
      }
    }, 600);
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [name, fields, i18n, loading, propertyId]);

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

  // --- Translation editors (active when activeLang !== "en") ---------
  const setLocaleName = (lang: string, value: string) =>
    setI18n((m) => ({ ...m, [lang]: { ...m[lang], name: value } }));

  const setFieldTr = (
    lang: string,
    fieldId: string,
    patch: { label?: string; helpText?: string },
  ) =>
    setI18n((m) => {
      const loc = m[lang] ?? {};
      const flds = { ...(loc.fields ?? {}) };
      flds[fieldId] = { ...(flds[fieldId] ?? {}), ...patch };
      return { ...m, [lang]: { ...loc, fields: flds } };
    });

  const setOptionTr = (
    lang: string,
    fieldId: string,
    idx: number,
    value: string,
    baseLen: number,
  ) =>
    setI18n((m) => {
      const loc = m[lang] ?? {};
      const flds = { ...(loc.fields ?? {}) };
      const cur = flds[fieldId] ?? {};
      const opts = (cur.options ?? []).slice();
      while (opts.length < baseLen) opts.push("");
      opts[idx] = value;
      flds[fieldId] = { ...cur, options: opts };
      return { ...m, [lang]: { ...loc, fields: flds } };
    });

  const translatedLocales = availableLocales(i18n);
  const translating = activeLang !== "en";

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
          {/* Auto-save status chip. No manual button — every edit
              persists ~600ms after the host stops typing. The label
              also functions as a passive reassurance: hosts who used
              to look for a "Save" button find a "Saved" indicator
              instead and know the work is safe. */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              saveState === "saving"
                ? "bg-[var(--bg-2)] text-[var(--ink-3)]"
                : saveState === "saved"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : saveState === "error"
                    ? "bg-rose-500/10 text-rose-500"
                    : "bg-[var(--bg-2)] text-[var(--ink-4)]"
            }`}
            aria-live="polite"
          >
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${
                saveState === "saving"
                  ? "animate-pulse bg-[var(--ink-3)]"
                  : saveState === "saved"
                    ? "bg-emerald-500"
                    : saveState === "error"
                      ? "bg-rose-500"
                      : "bg-emerald-500/60"
              }`}
            />
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
                ? "Saved"
                : saveState === "error"
                  ? "Save failed — retrying on next edit"
                  : "Changes save automatically"}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--ink-4)]">Loading…</p>
        ) : (
          <>
            {/* Language tabs — English is the base; the others are
                optional translations. A dot marks a language the host
                has already put content into. */}
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                  Language
                </span>
                {GUEST_FORM_LOCALES.map((l) => {
                  const isActive = l === activeLang;
                  const hasContent =
                    l !== "en" && translatedLocales.includes(l);
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setActiveLang(l)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-[var(--m-accent)] text-white"
                          : "bg-[var(--bg)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {LOCALE_NATIVE_NAME[l]}
                      {l === "en" && (
                        <span
                          className={
                            isActive ? "text-white/70" : "text-[var(--ink-4)]"
                          }
                        >
                          (base)
                        </span>
                      )}
                      {hasContent && (
                        <span
                          aria-hidden
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? "bg-white" : "bg-emerald-500"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-[var(--ink-4)]">
                {translating
                  ? `Translate the form into ${LOCALE_NATIVE_NAME[activeLang]}. Structure is set on the English tab — anything left blank here shows the English text to the guest.`
                  : "Build the form in English. Use the tabs above to add optional translations; guests pick their language on the share link."}
              </p>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Builder / Translation editor */}
              <div className="min-w-0 space-y-4 lg:flex-1">
                {translating ? (
                  <TranslationEditor
                    lang={activeLang}
                    baseName={name}
                    fields={fields}
                    i18n={i18n}
                    onName={(v) => setLocaleName(activeLang, v)}
                    onField={(id, patch) => setFieldTr(activeLang, id, patch)}
                    onOption={(id, idx, v, baseLen) =>
                      setOptionTr(activeLang, id, idx, v, baseLen)
                    }
                  />
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {/* Live preview — always shows the form in the active
                  language, so the host previews the exact result a
                  guest who picked that language would see. */}
              <aside className="w-full lg:w-[440px] lg:shrink-0">
                <div className="lg:sticky lg:top-3">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                    Guest preview · {LOCALE_NATIVE_NAME[activeLang]}
                  </p>
                  <FormPreview
                    name={name}
                    fields={fields}
                    i18n={i18n}
                    lang={activeLang}
                    propertyName={propertyName}
                  />
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Per-language translation editor. The structure (which fields exist,
// their type and order) is fixed by the English tab and shown read-only
// here — the host only fills in the translated text. Each base string
// is shown muted above its translation input as a reference.
function TranslationEditor({
  lang,
  baseName,
  fields,
  i18n,
  onName,
  onField,
  onOption,
}: {
  lang: GuestFormLocale;
  baseName: string;
  fields: FormField[];
  i18n: GuestFormI18n;
  onName: (v: string) => void;
  onField: (id: string, patch: { label?: string; helpText?: string }) => void;
  onOption: (id: string, idx: number, v: string, baseLen: number) => void;
}) {
  const loc = i18n[lang] ?? {};
  const trInput =
    "mt-1 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--m-accent)]";
  const refLine = "text-[11px] text-[var(--ink-4)]";

  return (
    <div className="space-y-4">
      {/* Form title */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4">
        <label className="block text-xs font-medium text-[var(--ink-3)]">
          Form title — {LOCALE_NATIVE_NAME[lang]}
        </label>
        <p className={`mt-1 ${refLine}`}>
          English: {baseName.trim() || "(not set)"}
        </p>
        <input
          value={loc.name ?? ""}
          onChange={(e) => onName(e.target.value)}
          placeholder={baseName.trim() || "Translated form title"}
          className={trInput}
        />
      </div>

      {fields.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--line-2)] px-4 py-8 text-center">
          <p className="text-sm text-[var(--ink-3)]">
            No questions to translate yet.
          </p>
          <p className="mt-0.5 text-xs text-[var(--ink-4)]">
            Add questions on the English tab first.
          </p>
        </div>
      )}

      {fields.map((f, i) => {
        const fieldTr = loc.fields?.[f.id] ?? {};
        const baseOptions = f.options ?? [];
        return (
          <div
            key={f.id}
            className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-[var(--bg-3)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
                {TYPE_LABEL[f.type]}
              </span>
              <span className="text-[11px] text-[var(--ink-4)]">#{i + 1}</span>
            </div>

            {/* Label */}
            <div className="mt-3">
              <p className={refLine}>
                English: {f.label.trim() || "(untitled question)"}
              </p>
              <input
                value={fieldTr.label ?? ""}
                onChange={(e) => onField(f.id, { label: e.target.value })}
                placeholder={f.label.trim() || "Translated question label"}
                className={trInput}
              />
            </div>

            {/* Help text — only when the base field has one */}
            {f.helpText && f.helpText.trim() && (
              <div className="mt-2">
                <p className={refLine}>English help text: {f.helpText}</p>
                <input
                  value={fieldTr.helpText ?? ""}
                  onChange={(e) => onField(f.id, { helpText: e.target.value })}
                  placeholder={f.helpText}
                  className={`${trInput} py-1.5 text-xs`}
                />
              </div>
            )}

            {/* Options — one translation input per base option */}
            {WITH_OPTIONS.has(f.type) && baseOptions.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <p className="text-[11px] font-medium text-[var(--ink-4)]">
                  Options
                </p>
                {baseOptions.map((opt, idx) => (
                  <div key={idx}>
                    <p className={refLine}>English: {opt}</p>
                    <input
                      value={fieldTr.options?.[idx] ?? ""}
                      onChange={(e) =>
                        onOption(f.id, idx, e.target.value, baseOptions.length)
                      }
                      placeholder={opt}
                      className={`${trInput} py-1.5 text-xs`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Renders the form the way the guest sees it on the public share page
// (the dark, standalone /g/<token> screen) so the host previews the
// real result while editing. Resolves the active language with the
// same fallback rules the guest page uses.
function FormPreview({
  name,
  fields,
  i18n,
  lang,
  propertyName,
}: {
  name: string;
  fields: FormField[];
  i18n: GuestFormI18n;
  lang: GuestFormLocale;
  propertyName: string;
}) {
  const inputCls =
    "mt-1.5 w-full rounded-md border border-[#1e2329] bg-[#161b22] px-3 py-2 text-sm text-[#e8e8ec]";
  const copy = GUEST_UI_COPY[lang];
  const title = resolveName(name, i18n, lang);

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)]">
      <div className="bg-[#0d1117] px-5 py-6">
        <p className="text-[10px] uppercase tracking-wider text-[#a0a0a8]">
          {propertyName}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-[#e8e8ec]">
          {title || copy.titleFallback}
        </h2>
        <p className="mt-1 text-xs text-[#a0a0a8]">{copy.intro}</p>

        <div className="mt-5 space-y-4">
          {fields.length === 0 && (
            <p className="rounded-md border border-dashed border-[#1e2329] px-3 py-6 text-center text-xs text-[#6b7280]">
              Your questions will appear here.
            </p>
          )}
          {fields.map((f) => {
            const r = resolveField(f, i18n, lang);
            return (
              <div key={f.id}>
                <span className="block text-sm font-medium text-[#e8e8ec]">
                  {r.label || "Untitled question"}
                  {f.required && <span className="ml-1 text-[#ff385c]">*</span>}
                </span>
                {r.helpText && (
                  <span className="mt-0.5 block text-xs text-[#a0a0a8]">
                    {r.helpText}
                  </span>
                )}
                {f.type === "long-text" ? (
                  <textarea rows={3} disabled className={inputCls} />
                ) : f.type === "yes-no" ? (
                  <div className="mt-1.5 flex gap-2">
                    {[copy.yes, copy.no].map((o) => (
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
                    <option>{copy.selectPlaceholder}</option>
                    {(r.options ?? []).map((o, i) => (
                      <option key={i}>{o}</option>
                    ))}
                  </select>
                ) : f.type === "multi-select" ? (
                  <div className="mt-1.5 space-y-1.5">
                    {(r.options ?? []).length === 0 && (
                      <span className="text-xs text-[#6b7280]">No options yet</span>
                    )}
                    {(r.options ?? []).map((o, i) => (
                      <span
                        key={i}
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
            );
          })}
        </div>

        {/* Preview Submit — visibly disabled so hosts don't click it
            expecting to save their work (the form auto-saves on edit;
            this button only exists in the rendered preview). */}
        <div className="mt-6 select-none rounded-md bg-[#ff385c]/40 px-4 py-2.5 text-center text-sm font-medium text-white/70">
          {copy.submit} <span className="text-[10px] uppercase tracking-wide text-white/60">· preview only</span>
        </div>
      </div>
    </div>
  );
}
