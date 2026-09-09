"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GUEST_UI_COPY,
  LOCALE_NATIVE_NAME,
  availableLocales,
  resolveField,
  resolveName,
  type GuestFormI18n,
  type GuestFormLocale,
  type GuestPrivacyCopy,
  type GuestUiCopy,
} from "@/lib/guest-form-i18n";
import {
  ARRIVAL_ORGANIZATIONS,
  COUNTRY_CODES,
  DOCUMENT_TYPES,
  GENDERS,
  SERVICE_TYPES,
  requiresNonEuBorderFields,
  type PrecheckinDraft,
} from "@/lib/precheckin";

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
  checkIn,
  checkOut,
  maxTravelers,
  initialPrecheckin,
  linkState,
  alreadySubmitted,
  submittedAt,
}: {
  token: string;
  templateName: string;
  fields: FormField[];
  i18n: GuestFormI18n;
  propertyName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  maxTravelers: number | null;
  initialPrecheckin: PrecheckinDraft | null;
  linkState: "active" | "revoked" | "expired" | "submitted" | "storage-error" | "security-error";
  alreadySubmitted: boolean;
  submittedAt: string | null;
}) {
  const langs = useMemo(() => availableLocales(i18n), [i18n]);
  const [lang, setLang] = useState<GuestFormLocale>("en");
  const copy = GUEST_UI_COPY[lang];

  const initialAnswers = Object.fromEntries(
    (initialPrecheckin?.customAnswers ?? []).map((answer) => [answer.fieldId, answer.value]),
  );
  const [values, setValues] = useState<Record<string, unknown>>(initialAnswers);
  const makeTraveler = (isLead: boolean, clientId = "lead-traveler") => ({
    clientId,
    isLead,
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    citizenshipCountry: "",
    birthCountry: "",
    birthPlace: "",
    residenceCountry: "",
    residencePlace: "",
    residenceAddress: "",
    documentType: "",
    documentNumber: "",
    borderEntryDate: "",
    borderEntryPlace: "",
    borderEntryPoint: "",
  });
  const [precheckin, setPrecheckin] = useState<PrecheckinDraft>(() => ({
    expectedArrivalTime: initialPrecheckin?.expectedArrivalTime ?? "",
    arrivalOrganization: initialPrecheckin?.arrivalOrganization ?? "INDIVIDUAL",
    serviceType: initialPrecheckin?.serviceType ?? "ACCOMMODATION",
    travelers: initialPrecheckin?.travelers?.length ? initialPrecheckin.travelers : [makeTraveler(true)],
    customAnswers: initialPrecheckin?.customAnswers ?? [],
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [draftState, setDraftState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // The structured traveler block is opt-in per reservation: the host turns it
  // on by setting the confirmed traveler count, which is what populates
  // maxTravelers. Without it this stays the plain custom-question form that
  // every existing link already points at, and the server applies the matching
  // rule in /api/g/[token]/submit.
  const precheckinEnabled = maxTravelers !== null;

  const set = (id: string, v: unknown) => {
    setValues((m) => ({ ...m, [id]: v }));
    setDirty(true);
  };

  const publicDraft = useMemo(() => ({
    ...precheckin,
    customAnswers: Object.entries(values).map(([fieldId, value]) => ({ fieldId, value })),
  }), [precheckin, values]);

  useEffect(() => {
    if (!dirty || linkState !== "active" || done || alreadySubmitted) return;
    const timer = window.setTimeout(async () => {
      setDraftState("saving");
      try {
        const response = await fetch(`/api/g/${token}/draft`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ precheckin: publicDraft }),
        });
        setDraftState(response.ok ? "saved" : "error");
      } catch {
        setDraftState("error");
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [alreadySubmitted, dirty, done, linkState, publicDraft, token]);

  const updateTraveler = (index: number, key: string, value: unknown) => {
    setPrecheckin((current) => ({
      ...current,
      travelers: current.travelers.map((traveler, travelerIndex) =>
        travelerIndex === index ? { ...traveler, [key]: value } : traveler,
      ),
    }));
    setDirty(true);
  };

  const addTraveler = () => {
    if (maxTravelers !== null && precheckin.travelers.length >= maxTravelers) return;
    setPrecheckin((current) => ({
      ...current,
      travelers: [
        ...current.travelers,
        makeTraveler(false, typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `traveler-${current.travelers.length + 1}`),
      ],
    }));
    setDirty(true);
  };

  const removeTraveler = (index: number) => {
    setPrecheckin((current) => {
      if (current.travelers.length === 1) return current;
      const next = current.travelers.filter((_, travelerIndex) => travelerIndex !== index);
      if (!next.some((traveler) => traveler.isLead)) next[0] = { ...next[0], isLead: true };
      return { ...current, travelers: next };
    });
    setDirty(true);
  };

  const markLead = (index: number) => {
    setPrecheckin((current) => ({
      ...current,
      travelers: current.travelers.map((traveler, travelerIndex) => ({
        ...traveler,
        isLead: travelerIndex === index,
      })),
    }));
    setDirty(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/g/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: values, precheckin: publicDraft }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // The server returns per-field reasons in `fields`. Showing only the
        // generic sentence left the guest guessing which of ~14 inputs was
        // wrong, and submit is rate-limited to 8 attempts per 15 minutes — so
        // blind retries lock them out of their own check-in.
        const details: string[] = Array.isArray(data.fields) ? data.fields.filter(
          (entry: unknown): entry is string => typeof entry === "string",
        ) : [];
        setError(
          details.length > 0
            ? `${data.error ?? copy.submitFailed}: ${details.join("; ")}`
            : data.error ?? copy.submitFailed,
        );
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

      {/* Trust / privacy panel — surfaces who hosts the data, how it's
          stored, and the guest's GDPR rights inline so a wary guest
          doesn't have to leave the page to feel safe filling it out.
          Skipped once the form is already submitted — the question is
          settled at that point. */}
      {!alreadySubmitted && <GuestFormPrivacyPanel copy={copy.privacy} />}

      {linkState === "security-error" ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-5">
          <p className="text-sm font-medium text-rose-200">
            This form is temporarily unavailable while your host completes a security setting. No data was collected.
          </p>
        </div>
      ) : linkState === "storage-error" ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-5">
          <p className="text-sm font-medium text-rose-200">
            Your saved data cannot be opened securely right now. Nothing was overwritten. Please contact your host.
          </p>
        </div>
      ) : linkState === "revoked" || linkState === "expired" ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-5">
          <p className="text-sm font-medium text-amber-200">
            This secure link is no longer active. Please contact your host for a new one.
          </p>
        </div>
      ) : alreadySubmitted ? (
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
        <form onSubmit={submit} className="space-y-6">
          {precheckinEnabled && (
          <section className="rounded-xl border border-[#1e2329] bg-[#11161d] p-4 sm:p-5">
            <h2 className="text-lg font-semibold">Stay details</h2>
            <p className="mt-1 text-xs text-[#a0a0a8]">
              Reservation: {checkIn} to {checkOut}. These dates come from your reservation and cannot be changed here.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="block text-sm font-medium">Expected arrival time *</span>
                <input
                  type="time"
                  required
                  value={precheckin.expectedArrivalTime}
                  onChange={(event) => {
                    setPrecheckin((current) => ({ ...current, expectedArrivalTime: event.target.value }));
                    setDirty(true);
                  }}
                  className={STRUCTURED_INPUT_CLASS}
                />
              </label>
              <ControlledSelect
                label="Arrival organization"
                value={precheckin.arrivalOrganization}
                options={ARRIVAL_ORGANIZATIONS}
                onChange={(value) => {
                  setPrecheckin((current) => ({ ...current, arrivalOrganization: value }));
                  setDirty(true);
                }}
              />
              <ControlledSelect
                label="Service type"
                value={precheckin.serviceType}
                options={SERVICE_TYPES}
                onChange={(value) => {
                  setPrecheckin((current) => ({ ...current, serviceType: value }));
                  setDirty(true);
                }}
              />
            </div>
          </section>
          )}

          {precheckinEnabled && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Travelers</h2>
                <p className="text-xs text-[#a0a0a8]">
                  Enter every person staying, including children.
                  {maxTravelers !== null ? ` This reservation is for ${maxTravelers}.` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={addTraveler}
                disabled={maxTravelers !== null && precheckin.travelers.length >= maxTravelers}
                className="rounded-md border border-[#2c333d] bg-[#161b22] px-3 py-2 text-xs font-medium"
              >
                Add traveler
              </button>
            </div>
            {precheckin.travelers.map((traveler, index) => (
              <TravelerEditor
                key={String(traveler.clientId ?? index)}
                index={index}
                traveler={traveler}
                canRemove={precheckin.travelers.length > 1}
                onChange={(key, value) => updateTraveler(index, key, value)}
                onRemove={() => removeTraveler(index)}
                onMarkLead={() => markLead(index)}
              />
            ))}
          </section>
          )}

          {fields.length > 0 && (
            <section className="space-y-4 rounded-xl border border-[#1e2329] bg-[#11161d] p-4 sm:p-5">
              <h2 className="text-lg font-semibold">Additional questions</h2>
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
            </section>
          )}

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
          <p aria-live="polite" className="text-center text-[11px] text-[#707782]">
            {draftState === "saving" ? "Saving encrypted draft…" : draftState === "saved" ? "Encrypted draft saved" : draftState === "error" ? "Draft could not be saved" : ""}
          </p>
        </form>
      )}
    </div>
  );
}

const STRUCTURED_INPUT_CLASS =
  "mt-1.5 w-full min-w-0 rounded-md border border-[#1e2329] bg-[#161b22] px-3 py-2 text-sm text-[#e8e8ec] focus:border-[#ff385c] focus:outline-none";

function ControlledSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="block text-sm font-medium">{label} *</span>
      <select required value={value} onChange={(event) => onChange(event.target.value)} className={STRUCTURED_INPUT_CLASS}>
        <option value="">Select…</option>
        {options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
      </select>
    </label>
  );
}

function TravelerEditor({
  index,
  traveler,
  canRemove,
  onChange,
  onRemove,
  onMarkLead,
}: {
  index: number;
  traveler: Record<string, unknown>;
  canRemove: boolean;
  onChange: (key: string, value: unknown) => void;
  onRemove: () => void;
  onMarkLead: () => void;
}) {
  const text = (key: string) => typeof traveler[key] === "string" ? traveler[key] as string : "";
  const isLead = traveler.isLead === true;
  const field = (key: string, label: string, type = "text", autoComplete?: string) => (
    <label className="block min-w-0">
      <span className="block text-sm font-medium">{label} *</span>
      <input
        type={type}
        required
        autoComplete={autoComplete}
        value={text(key)}
        onChange={(event) => onChange(key, event.target.value)}
        className={STRUCTURED_INPUT_CLASS}
      />
    </label>
  );
  const nonEu = requiresNonEuBorderFields(text("residenceCountry"));
  return (
    <fieldset className="rounded-xl border border-[#1e2329] bg-[#11161d] p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold">Traveler {index + 1}{isLead ? " · lead guest" : ""}</legend>
      <div className="mb-4 flex flex-wrap gap-2">
        {!isLead && <button type="button" onClick={onMarkLead} className="rounded-md border border-[#2c333d] px-2.5 py-1.5 text-xs">Make lead guest</button>}
        {canRemove && <button type="button" onClick={onRemove} className="rounded-md border border-rose-500/30 px-2.5 py-1.5 text-xs text-rose-200">Remove</button>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("firstName", "First name", "text", "given-name")}
        {field("lastName", "Last name", "text", "family-name")}
        {field("dateOfBirth", "Date of birth", "date", "bday")}
        <ControlledSelect label="Gender" value={text("gender")} options={GENDERS} onChange={(value) => onChange("gender", value)} />
        <ControlledSelect label="Citizenship country" value={text("citizenshipCountry")} options={COUNTRY_CODES} onChange={(value) => onChange("citizenshipCountry", value)} />
        <ControlledSelect label="Birth country" value={text("birthCountry")} options={COUNTRY_CODES} onChange={(value) => onChange("birthCountry", value)} />
        {field("birthPlace", "Birth place")}
        <ControlledSelect label="Residence country" value={text("residenceCountry")} options={COUNTRY_CODES} onChange={(value) => onChange("residenceCountry", value)} />
        {field("residencePlace", "Residence place")}
        {field("residenceAddress", "Residence address", "text", "street-address")}
        <ControlledSelect label="Document type" value={text("documentType")} options={DOCUMENT_TYPES} onChange={(value) => onChange("documentType", value)} />
        {field("documentNumber", "Document number")}
        {nonEu && (
          <>
            <label className="block min-w-0">
              <span className="block text-sm font-medium">Border entry date</span>
              <input type="date" value={text("borderEntryDate")} onChange={(event) => onChange("borderEntryDate", event.target.value)} className={STRUCTURED_INPUT_CLASS} />
            </label>
            <label className="block min-w-0">
              <span className="block text-sm font-medium">Border entry place</span>
              <input value={text("borderEntryPlace")} onChange={(event) => onChange("borderEntryPlace", event.target.value)} className={STRUCTURED_INPUT_CLASS} />
            </label>
            <label className="block min-w-0 sm:col-span-2">
              <span className="block text-sm font-medium">Border entry point</span>
              <input value={text("borderEntryPoint")} onChange={(event) => onChange("borderEntryPoint", event.target.value)} className={STRUCTURED_INPUT_CLASS} />
            </label>
          </>
        )}
      </div>
    </fieldset>
  );
}

// Inline privacy / data-handling reassurance shown above the form. The
// always-visible summary covers 80% of guest worries in one sentence;
// the "Details" toggle expands into a short GDPR-aware breakdown plus
// outbound links to the full policy and the open-source repo so a
// genuinely concerned guest can verify everything themselves. Exported
// so the host-side builder preview can render the exact same panel.
export function GuestFormPrivacyPanel({ copy }: { copy: GuestPrivacyCopy }) {
  const [open, setOpen] = useState(false);
  return (
    <section
      aria-label={copy.title}
      className="mb-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2.5l8 3v6c0 5-3.5 8.8-8 10-4.5-1.2-8-5-8-10v-6l8-3z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.5l2 2 4-4"
            />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#e8e8ec]">{copy.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#a0a0a8]">
              {copy.summary}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="shrink-0 rounded-md border border-[#1e2329] bg-[#161b22] px-2.5 py-1 text-[11px] font-medium text-[#a0a0a8] transition-colors hover:border-emerald-500/40 hover:text-[#e8e8ec]"
        >
          {open ? copy.hideDetails : copy.showDetails}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-emerald-500/15 pt-3">
          {copy.bullets.map((b, i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-[#e8e8ec]">{b.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#a0a0a8]">
                {b.body}
              </p>
            </div>
          ))}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-xs">
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
            >
              {copy.fullPolicyLabel} →
            </a>
            <a
              href="https://github.com/Gribadan/RentTools.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
            >
              {copy.sourceLinkLabel} →
            </a>
          </div>
        </div>
      )}
    </section>
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
