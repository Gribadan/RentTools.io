"use client";

import { useMemo, useState } from "react";
import {
  GUEST_UI_COPY,
  LOCALE_NATIVE_NAME,
  availableLocales,
  resolveField,
  resolveName,
  type GuestFormI18n,
  type GuestFormLocale,
  type GuestUiCopy,
} from "@/lib/guest-form-i18n";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  helpText?: string;
  options?: string[];
}

interface ResolvedField {
  label: string;
  helpText?: string;
  options?: string[];
}

// Full guest-facing pre-arrival form: property header, language picker,
// and the answerable fields. A client component so the guest can switch
// language live — host content (title / labels / options) and the
// standing UI strings both re-resolve into the chosen locale, falling
// back to English wherever the host left a translation blank.
export function GuestFormView({
  token,
  templateName,
  fields,
  i18n,
  propertyName,
  guestName,
  alreadySubmitted,
  submittedAt,
}: {
  token: string;
  templateName: string;
  fields: FormField[];
  i18n: GuestFormI18n;
  propertyName: string;
  guestName: string;
  alreadySubmitted: boolean;
  submittedAt: string | null;
}) {
  const langs = useMemo(() => availableLocales(i18n), [i18n]);
  const [lang, setLang] = useState<GuestFormLocale>("en");
  const copy = GUEST_UI_COPY[lang];

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (id: string, v: unknown) => setValues((m) => ({ ...m, [id]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/g/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: values }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? copy.submitFailed);
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  const title = resolveName(templateName, i18n, lang) || copy.titleFallback;

  return (
    <div>
      {/* Language picker — only when the host actually translated the
          form into at least one other language. */}
      {langs.length > 1 && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-[#a0a0a8]">{copy.language}:</span>
          {langs.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                l === lang
                  ? "bg-[#ff385c] text-white"
                  : "bg-[#161b22] text-[#a0a0a8] hover:text-[#e8e8ec]"
              }`}
            >
              {LOCALE_NATIVE_NAME[l]}
            </button>
          ))}
        </div>
      )}

      <header className="mb-6">
        <p className="text-xs uppercase tracking-wider text-[#a0a0a8]">
          {propertyName}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-[#a0a0a8]">{copy.greeting(guestName)}</p>
      </header>

      {alreadySubmitted ? (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-5">
          <p className="text-sm font-medium text-emerald-300">{copy.thanks}</p>
          {submittedAt && (
            <p className="mt-1 text-xs text-[#a0a0a8]">
              {copy.submittedOn(submittedAt)}
            </p>
          )}
        </div>
      ) : done ? (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-5">
          <p className="text-sm font-medium text-emerald-300">{copy.thanks}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {fields.map((f) => (
            <FieldInput
              key={f.id}
              field={f}
              resolved={resolveField(f, i18n, lang)}
              value={values[f.id]}
              onChange={(v) => set(f.id, v)}
              copy={copy}
            />
          ))}

          {error && (
            <p className="rounded-md border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-[#ff385c] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? copy.submitting : copy.submit}
          </button>
        </form>
      )}
    </div>
  );
}

function FieldInput({
  field,
  resolved,
  value,
  onChange,
  copy,
}: {
  field: FormField;
  resolved: ResolvedField;
  value: unknown;
  onChange: (v: unknown) => void;
  copy: GuestUiCopy;
}) {
  const labelEl = (
    <>
      <span className="block text-sm font-medium text-[#e8e8ec]">
        {resolved.label || "Question"}
        {field.required && <span className="ml-1 text-[#ff385c]">*</span>}
      </span>
      {resolved.helpText && (
        <span className="mt-0.5 block text-xs text-[#a0a0a8]">
          {resolved.helpText}
        </span>
      )}
    </>
  );

  const inputClass =
    "mt-1.5 w-full rounded-md border border-[#1e2329] bg-[#161b22] px-3 py-2 text-sm text-[#e8e8ec] focus:outline-none focus:border-[#ff385c]";

  switch (field.type) {
    case "long-text":
      return (
        <label className="block">
          {labelEl}
          <textarea
            rows={4}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={inputClass}
          />
        </label>
      );
    case "number":
      return (
        <label className="block">
          {labelEl}
          <input
            type="number"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={inputClass}
          />
        </label>
      );
    case "date":
      return (
        <label className="block">
          {labelEl}
          <input
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={inputClass}
          />
        </label>
      );
    case "time":
      return (
        <label className="block">
          {labelEl}
          <input
            type="time"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={inputClass}
          />
        </label>
      );
    case "phone":
      return (
        <label className="block">
          {labelEl}
          <input
            type="tel"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={inputClass}
          />
        </label>
      );
    case "email":
      return (
        <label className="block">
          {labelEl}
          <input
            type="email"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={inputClass}
          />
        </label>
      );
    case "yes-no":
      return (
        <fieldset className="block">
          {labelEl}
          <div className="mt-1.5 flex gap-2">
            {(["yes", "no"] as const).map((opt) => (
              <label
                key={opt}
                className="flex-1 rounded-md border border-[#1e2329] bg-[#161b22] px-3 py-2 text-sm text-[#e8e8ec] cursor-pointer text-center"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  required={field.required}
                  className="mr-2"
                />
                {opt === "yes" ? copy.yes : copy.no}
              </label>
            ))}
          </div>
        </fieldset>
      );
    case "select": {
      const options = resolved.options ?? [];
      return (
        <label className="block">
          {labelEl}
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={inputClass}
          >
            <option value="">{copy.selectPlaceholder}</option>
            {options.map((o, i) => (
              <option key={i} value={(field.options ?? [])[i] ?? o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      );
    }
    case "multi-select": {
      const options = resolved.options ?? [];
      const baseOptions = field.options ?? [];
      const arr = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (opt: string) =>
        onChange(arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt]);
      return (
        <fieldset className="block">
          {labelEl}
          <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {options.map((o, i) => {
              // The stored answer value is always the base English
              // option so the host reads consistent submissions
              // regardless of the guest's chosen language.
              const stored = baseOptions[i] ?? o;
              return (
                <label
                  key={i}
                  className="flex min-w-0 items-center gap-2 rounded-md border border-[#1e2329] bg-[#161b22] px-3 py-2 text-sm text-[#e8e8ec] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={arr.includes(stored)}
                    onChange={() => toggle(stored)}
                    className="shrink-0"
                  />
                  <span className="min-w-0 break-words">{o}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      );
    }
    case "short-text":
    default:
      return (
        <label className="block">
          {labelEl}
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={inputClass}
          />
        </label>
      );
  }
}
