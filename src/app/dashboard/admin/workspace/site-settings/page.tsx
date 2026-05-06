"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

// RT-25.9 tick 12 — Site settings sub-route at
// /dashboard/admin/workspace/site-settings. Lifts the "Admin · Site
// settings" section out of admin-panel.tsx into its own deep-linkable
// surface. Reuses /api/admin/site-settings GET/PUT (superadmin-gated).
// Non-superadmin users see a permission notice instead of the form.
// SettingsPanel still renders its copy until the removal sweep ships.

interface SiteSettingsMap {
  [key: string]: { value: string; updatedAt: string | null };
}

interface MeResponse {
  user?: { role: string } | null;
}

interface FieldDef {
  key: string;
  label: { en: string; ru: string };
  hint: { en: string; ru: string };
  type: "toggle" | "number" | "text" | "email";
  defaultValue: string;
}

const FIELDS: ReadonlyArray<FieldDef> = [
  {
    key: "signup_enabled",
    label: { en: "Public signup", ru: "Публичная регистрация" },
    hint: {
      en: "Toggle whether new accounts can be created.",
      ru: "Разрешить ли создание новых аккаунтов.",
    },
    type: "toggle",
    defaultValue: "true",
  },
  {
    key: "extraction_per_user_daily_limit",
    label: { en: "Daily extraction quota (per user)", ru: "Лимит распознавания (в сутки на пользователя)" },
    hint: {
      en: "Max passport extractions one user may run in 24h. 0 disables the limit.",
      ru: "Сколько паспортов один пользователь может распознать за 24 часа. 0 отключает лимит.",
    },
    type: "number",
    defaultValue: "20",
  },
  {
    key: "landing_announcement",
    label: { en: "Landing announcement banner", ru: "Объявление на главной" },
    hint: {
      en: "Short message shown at the top of the public landing page. Leave empty to hide.",
      ru: "Короткое сообщение в шапке публичной главной. Оставьте пустым, чтобы скрыть.",
    },
    type: "text",
    defaultValue: "",
  },
  {
    key: "support_email",
    label: { en: "Support email", ru: "Email поддержки" },
    hint: {
      en: "Public contact address surfaced in landing/footer/help.",
      ru: "Публичный контактный адрес — отображается в подвале и помощи.",
    },
    type: "email",
    defaultValue: "",
  },
];

export default function AdminSiteSettingsPage() {
  const { locale } = useI18n();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [settings, setSettings] = useState<SiteSettingsMap>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ key: string; text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? (r.json() as Promise<MeResponse>) : null))
      .then((data) => setRole(data?.user?.role ?? null))
      .catch(() => setRole(null))
      .finally(() => setRoleLoaded(true));
  }, []);

  const isSuperadmin = role === "superadmin";

  useEffect(() => {
    if (!isSuperadmin) return;
    void load();
  }, [isSuperadmin]);

  const load = async () => {
    const res = await fetch("/api/admin/site-settings");
    if (!res.ok) return;
    const data = (await res.json()) as SiteSettingsMap;
    setSettings(data);
    const next: Record<string, string> = {};
    for (const f of FIELDS) {
      next[f.key] = data[f.key]?.value ?? f.defaultValue;
    }
    setDrafts(next);
  };

  const saveKey = async (key: string, value: string) => {
    setSavingKey(key);
    setMessage(null);
    const res = await fetch("/api/admin/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSavingKey(null);
    if (res.ok) {
      setMessage({
        key,
        text: locale === "ru" ? "Сохранено. Кэш обновится в течение 60 сек." : "Saved. Cached settings refresh within 60s.",
        ok: true,
      });
      await load();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage({
        key,
        text: data.error ?? (locale === "ru" ? "Не удалось сохранить" : "Failed to save"),
        ok: false,
      });
    }
    setTimeout(() => setMessage((m) => (m && m.key === key ? null : m)), 4000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {locale === "ru" ? "Настройки сайта" : "Site settings"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Глобальные настройки инстанса, влияющие на публичные страницы и квоты пользователей."
            : "Instance-wide settings that affect public pages and user quotas."}
        </p>
      </div>

      {!roleLoaded ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-4)]">
          {locale === "ru" ? "Загрузка..." : "Loading..."}
        </div>
      ) : !isSuperadmin ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {locale === "ru"
            ? "Только суперадминистратор может изменять глобальные настройки сайта."
            : "Only superadmins can edit instance-wide site settings."}
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5">
          {FIELDS.map((f) => {
            const draft = drafts[f.key] ?? f.defaultValue;
            const saved = settings[f.key]?.value ?? f.defaultValue;
            const dirty = draft !== saved;
            const label = locale === "ru" ? f.label.ru : f.label.en;
            const hint = locale === "ru" ? f.hint.ru : f.hint.en;
            return (
              <div
                key={f.key}
                className="grid gap-2 border-b border-[var(--line)]/50 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)]" htmlFor={`ss-${f.key}`}>
                    {label}
                  </label>
                  <p className="mt-0.5 text-xs text-[var(--ink-4)]">{hint}</p>
                  {message?.key === f.key && (
                    <p className={`mt-1 text-xs ${message.ok ? "text-emerald-300" : "text-rose-300"}`}>
                      {message.text}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {f.type === "toggle" ? (
                    <select
                      id={`ss-${f.key}`}
                      value={draft}
                      onChange={(e) => setDrafts((d) => ({ ...d, [f.key]: e.target.value }))}
                      className="h-10 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)]"
                    >
                      <option value="true">{locale === "ru" ? "Включено" : "Enabled"}</option>
                      <option value="false">{locale === "ru" ? "Отключено" : "Disabled"}</option>
                    </select>
                  ) : (
                    <input
                      id={`ss-${f.key}`}
                      type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
                      value={draft}
                      onChange={(e) => setDrafts((d) => ({ ...d, [f.key]: e.target.value }))}
                      className="h-10 w-64 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] placeholder-[var(--ink-4)] outline-none transition-colors focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => saveKey(f.key, draft)}
                    disabled={!dirty || savingKey === f.key}
                    className="h-10 rounded-md bg-[var(--m-accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-60"
                  >
                    {savingKey === f.key
                      ? locale === "ru"
                        ? "Сохр..."
                        : "Saving"
                      : locale === "ru"
                      ? "Сохранить"
                      : "Save"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
