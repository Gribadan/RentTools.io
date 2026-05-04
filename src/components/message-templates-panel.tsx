"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

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
      setError(locale === "ru" ? "Имя и текст обязательны" : "Name and body are required");
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
    if (!confirm(locale === "ru" ? "Удалить шаблон?" : "Delete this template?")) return;
    await fetch(`/api/message-templates/${id}`, { method: "DELETE" });
    await refresh();
  };

  const insertVar = (v: string) => {
    setBodyText((prev) => prev + (prev.endsWith("\n") || prev === "" ? "" : " ") + v);
  };

  return (
    <div className="rounded-lg border border-[#27272b] bg-[#18181b] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#e8e8ec]">
          {locale === "ru" ? "Шаблоны сообщений" : "Message templates"}
        </h3>
        {editingId === null && (
          <button
            onClick={startCreate}
            className="rounded-md border border-[#333338] px-2 py-1 text-xs text-[#e8e8ec] hover:bg-[#27272b]"
          >
            {locale === "ru" ? "Новый шаблон" : "New template"}
          </button>
        )}
      </div>

      {editingId !== null && (
        <div className="mb-4 space-y-2 rounded-md border border-[#333338] bg-[#111113] p-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={locale === "ru" ? "Название" : "Template name"}
              className="h-8 rounded-md border border-[#333338] bg-[#18181b] px-2 text-xs text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
            />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-8 rounded-md border border-[#333338] bg-[#18181b] px-2 text-xs text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={locale === "ru" ? "Тема (опц.)" : "Subject (optional)"}
            className="h-8 w-full rounded-md border border-[#333338] bg-[#18181b] px-2 text-xs text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
          />
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder={locale === "ru" ? "Текст сообщения" : "Message body"}
            rows={5}
            className="w-full rounded-md border border-[#333338] bg-[#18181b] px-2 py-1.5 text-xs text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
          />
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-[#71717a]">
              {locale === "ru" ? "Переменные:" : "Variables:"}
            </span>
            {VAR_HINTS.map((v) => (
              <button
                key={v}
                onClick={() => insertVar(v)}
                className="rounded bg-[#27272b] px-1.5 py-0.5 font-mono text-[#a0a0a8] hover:bg-[#333338] hover:text-[#e8e8ec]"
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#a0a0a8]">
              {locale === "ru" ? "Отправлять (дни до/после заезда)" : "Offset days from check-in"}
            </span>
            <input
              type="number"
              value={sendOffsetDays}
              onChange={(e) => setSendOffsetDays(Number(e.target.value) || 0)}
              className="h-7 w-16 rounded-md border border-[#333338] bg-[#18181b] px-2 text-xs text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
            />
          </div>

          {bodyText && (
            <div className="rounded-md border border-[#27272b] bg-[#0d1117] p-2 text-xs">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-[#71717a]">
                {locale === "ru" ? "Превью" : "Preview"}
              </div>
              {subject && (
                <div className="mb-1 font-semibold text-[#e8e8ec]">
                  {renderTemplate(subject, SAMPLE_VARS)}
                </div>
              )}
              <pre className="whitespace-pre-wrap font-sans text-[#d4d4d8]">
                {renderTemplate(bodyText, SAMPLE_VARS)}
              </pre>
            </div>
          )}

          {error && <p className="text-xs text-[#ef4444]">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={cancel}
              disabled={busy}
              className="rounded-md px-2 py-1 text-xs text-[#a0a0a8] hover:text-[#e8e8ec]"
            >
              {locale === "ru" ? "Отмена" : "Cancel"}
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="rounded-md bg-[#ff385c] px-3 py-1 text-xs font-medium text-white hover:bg-[#e0294d] disabled:opacity-50"
            >
              {locale === "ru" ? "Сохранить" : "Save"}
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <p className="text-xs text-[#71717a]">
          {locale === "ru"
            ? "Шаблоны сообщений не созданы."
            : "No templates yet."}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {templates.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 rounded-md border border-[#27272b] bg-[#111113] px-3 py-2 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[#e8e8ec]">
                  {t.name}
                  <span className="ml-2 rounded bg-[#27272b] px-1.5 py-0.5 text-[10px] uppercase text-[#a0a0a8]">
                    {t.language}
                  </span>
                </div>
                <div className="truncate text-[11px] text-[#71717a]">{t.subject || t.body.slice(0, 80)}</div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => startEdit(t)}
                  className="rounded px-2 py-1 text-[#a0a0a8] hover:text-[#e8e8ec]"
                >
                  {locale === "ru" ? "Изменить" : "Edit"}
                </button>
                <button
                  onClick={() => remove(t.id)}
                  className="rounded px-2 py-1 text-[#ef4444] hover:bg-[#ef4444]/10"
                >
                  {locale === "ru" ? "Удалить" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
