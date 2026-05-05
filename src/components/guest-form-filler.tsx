"use client";

import { useState } from "react";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

export function GuestFormFiller({ token, fields }: { token: string; fields: FormField[] }) {
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
        setError(data.error ?? "Submit failed");
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-5">
        <p className="text-sm font-medium text-emerald-300">Thanks — your answers are recorded.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {fields.map((f) => (
        <FieldInput key={f.id} field={f} value={values[f.id]} onChange={(v) => set(f.id, v)} />
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
        {busy ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const labelEl = (
    <span className="block text-sm font-medium text-[#e8e8ec]">
      {field.label || "Question"}
      {field.required && <span className="ml-1 text-[#ff385c]">*</span>}
    </span>
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
    case "yes-no":
      return (
        <fieldset className="block">
          {labelEl}
          <div className="mt-1.5 flex gap-2">
            {["yes", "no"].map((opt) => (
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
                {opt === "yes" ? "Yes" : "No"}
              </label>
            ))}
          </div>
        </fieldset>
      );
    case "select": {
      const options = field.options ?? [];
      return (
        <label className="block">
          {labelEl}
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={inputClass}
          >
            <option value="">— select —</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      );
    }
    case "multi-select": {
      const options = field.options ?? [];
      const arr = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (opt: string) =>
        onChange(arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt]);
      return (
        <fieldset className="block">
          {labelEl}
          <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {options.map((o) => (
              <label
                key={o}
                className="flex items-center gap-2 rounded-md border border-[#1e2329] bg-[#161b22] px-3 py-2 text-sm text-[#e8e8ec] cursor-pointer"
              >
                <input type="checkbox" checked={arr.includes(o)} onChange={() => toggle(o)} />
                {o}
              </label>
            ))}
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
