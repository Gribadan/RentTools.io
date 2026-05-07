"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface CopyShape {
  nameAndBodyRequired: string;
  confirmDelete: string;
  title: string;
  newTemplate: string;
  namePlaceholder: string;
  subjectPlaceholder: string;
  bodyPlaceholder: string;
  variables: string;
  offsetLabel: string;
  preview: string;
  cancel: string;
  save: string;
  empty: string;
  edit: string;
  remove: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    nameAndBodyRequired: "Name and body are required",
    confirmDelete: "Delete this template?",
    title: "Message templates",
    newTemplate: "New template",
    namePlaceholder: "Template name",
    subjectPlaceholder: "Subject (optional)",
    bodyPlaceholder: "Message body",
    variables: "Variables:",
    offsetLabel: "Offset days from check-in",
    preview: "Preview",
    cancel: "Cancel",
    save: "Save",
    empty: "No templates yet.",
    edit: "Edit",
    remove: "Delete",
  },
  ru: {
    nameAndBodyRequired: "Имя и текст обязательны",
    confirmDelete: "Удалить шаблон?",
    title: "Шаблоны сообщений",
    newTemplate: "Новый шаблон",
    namePlaceholder: "Название",
    subjectPlaceholder: "Тема (опц.)",
    bodyPlaceholder: "Текст сообщения",
    variables: "Переменные:",
    offsetLabel: "Отправлять (дни до/после заезда)",
    preview: "Превью",
    cancel: "Отмена",
    save: "Сохранить",
    empty: "Шаблоны сообщений не созданы.",
    edit: "Изменить",
    remove: "Удалить",
  },
  de: {
    nameAndBodyRequired: "Name und Text sind erforderlich",
    confirmDelete: "Diese Vorlage löschen?",
    title: "Nachrichtenvorlagen",
    newTemplate: "Neue Vorlage",
    namePlaceholder: "Vorlagenname",
    subjectPlaceholder: "Betreff (optional)",
    bodyPlaceholder: "Nachrichtentext",
    variables: "Variablen:",
    offsetLabel: "Tage vor/nach Check-in",
    preview: "Vorschau",
    cancel: "Abbrechen",
    save: "Speichern",
    empty: "Noch keine Vorlagen.",
    edit: "Bearbeiten",
    remove: "Löschen",
  },
};

interface MessageTemplate {
  id: number;
  propertyId: number;
  name: string;
  language: string;
  subject: string;
  body: string;
  sendOffsetDays: number;
}

interface MessageTemplatesPanelProps {
  propertyId: number;
}

const SAMPLE_VARS: Record<string, string> = {
  guestName: "John Smith",
  checkIn: "2026-06-12",
  checkOut: "2026-06-19",
  wifiPassword: "rent-tool-12345",
  propertyName: "Sample Property",
};

const VAR_HINTS = ["{{guestName}}", "{{checkIn}}", "{{checkOut}}", "{{wifiPassword}}", "{{propertyName}}"];

function renderTemplate(input: string, vars: Record<string, string>): string {
  return input.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : `{{${k}}}`
  );
}

export function MessageTemplatesPanel({ propertyId }: MessageTemplatesPanelProps) {
  const { locale } = useI18n();
  const c = COPY[locale];
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [sendOffsetDays, setSendOffsetDays] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch(`/api/message-templates?propertyId=${propertyId}`);
    if (!res.ok) return;
    const data = await res.json();
    setTemplates((data.templates || []) as MessageTemplate[]);
  };

  useEffect(() => {
    refresh();
  }, [propertyId]);

  const startCreate = () => {
    setEditingId("new");
    setName("");
    setLanguage("en");
    setSubject("");
    setBodyText("");
    setSendOffsetDays(0);
    setError(null);
  };

  const startEdit = (t: MessageTemplate) => {
    setEditingId(t.id);
    setName(t.name);
    setLanguage(t.language);
    setSubject(t.subject);
    setBodyText(t.body);
    setSendOffsetDays(t.sendOffsetDays);
    setError(null);
  };

  const cancel = () => {
    setEditingId(null);
    setError(null);
  };

  const save = async () => {
    if (!name.trim() || !bodyText.trim()) {
      setError(c.nameAndBodyRequired);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        propertyId,
        name: name.trim(),
        language,
        subject,
        body: bodyText,
        sendOffsetDays,
      };
      if (editingId === "new") {
        const res = await fetch("/api/message-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d.error || "Failed");
          return;
        }
      } else if (typeof editingId === "number") {
        const res = await fetch(`/api/message-templates/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d.error || "Failed");
          return;
        }
      }
      setEditingId(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm(c.confirmDelete)) return;
    await fetch(`/api/message-templates/${id}`, { method: "DELETE" });
    await refresh();
  };

  const insertVar = (v: string) => {
    setBodyText((prev) => prev + (prev.endsWith("\n") || prev === "" ? "" : " ") + v);
  };

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          {c.title}
        </h3>
        {editingId === null && (
          <button
            onClick={startCreate}
            className="rounded-md border border-[var(--line-2)] px-2 py-1 text-xs text-[var(--ink)] hover:bg-[var(--line-2)]"
          >
            {c.newTemplate}
          </button>
        )}
      </div>

      {editingId !== null && (
        <div className="mb-4 space-y-2 rounded-md border border-[var(--line-2)] bg-[var(--bg)] p-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={c.namePlaceholder}
              className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-8 rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={c.subjectPlaceholder}
            className="h-8 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
          />
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder={c.bodyPlaceholder}
            rows={5}
            className="w-full rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-2 py-1.5 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
          />
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-[var(--ink-4)]">
              {c.variables}
            </span>
            {VAR_HINTS.map((v) => (
              <button
                key={v}
                onClick={() => insertVar(v)}
                className="rounded bg-[var(--line-2)] px-1.5 py-0.5 font-mono text-[var(--ink-3)] hover:bg-[var(--line-2)] hover:text-[var(--ink)]"
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--ink-3)]">
              {c.offsetLabel}
            </span>
            <input
              type="number"
              value={sendOffsetDays}
              onChange={(e) => setSendOffsetDays(Number(e.target.value) || 0)}
              className="h-7 w-16 rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-2 text-xs text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            />
          </div>

          {bodyText && (
            <div className="rounded-md border border-[var(--line)] bg-[var(--bg)] p-2 text-xs">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-[var(--ink-4)]">
                {c.preview}
              </div>
              {subject && (
                <div className="mb-1 font-semibold text-[var(--ink)]">
                  {renderTemplate(subject, SAMPLE_VARS)}
                </div>
              )}
              <pre className="whitespace-pre-wrap font-sans text-[var(--ink-2)]">
                {renderTemplate(bodyText, SAMPLE_VARS)}
              </pre>
            </div>
          )}

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={cancel}
              disabled={busy}
              className="rounded-md px-2 py-1 text-xs text-[var(--ink-3)] hover:text-[var(--ink)]"
            >
              {c.cancel}
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="rounded-md bg-[var(--m-accent)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--m-accent-2)] disabled:opacity-50"
            >
              {c.save}
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <p className="text-xs text-[var(--ink-4)]">
          {c.empty}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {templates.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[var(--ink)]">
                  {t.name}
                  <span className="ml-2 rounded bg-[var(--line-2)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--ink-3)]">
                    {t.language}
                  </span>
                </div>
                <div className="truncate text-[11px] text-[var(--ink-4)]">{t.subject || t.body.slice(0, 80)}</div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => startEdit(t)}
                  className="rounded px-2 py-1 text-[var(--ink-3)] hover:text-[var(--ink)]"
                >
                  {c.edit}
                </button>
                <button
                  onClick={() => remove(t.id)}
                  className="rounded px-2 py-1 text-rose-500 hover:bg-rose-500/10"
                >
                  {c.remove}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
