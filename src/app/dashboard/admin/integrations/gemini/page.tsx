"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

// RT-25.9 tick 4 — Gemini AI key sub-route. The first slice off the
// long-scroll SettingsPanel: the Gemini API key card now lives at
// /dashboard/admin/integrations/gemini. SettingsPanel still renders
// its copy of the card so the legacy ?view=settings surface keeps
// working until the SettingsPanel removal sweep ships.

interface MeResponse {
  user?: { id: number; username: string; role: string } | null;
}

export default function AdminGeminiPage() {
  const { t, locale } = useI18n();
  const [role, setRole] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? (r.json() as Promise<MeResponse>) : null))
      .then((data) => setRole(data?.user?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setKey(data.gemini_api_key || "");
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "gemini_api_key", value: key }),
    });
    setSaving(false);
    setMessage(
      res.ok
        ? locale === "ru"
          ? "Сохранено"
          : "Saved"
        : locale === "ru"
        ? "Не удалось сохранить"
        : "Failed to save"
    );
    setTimeout(() => setMessage(""), 2000);
  };

  const isSuperAdmin = role === "superadmin";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {t("settings.geminiKey")}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Используется для извлечения данных из паспортов гостей. Хранится в site_settings и применяется ко всему инстансу."
            : "Used for guest passport data extraction. Stored in site_settings and applied instance-wide."}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5">
        {!loaded ? (
          <p className="text-sm text-[var(--ink-4)]">
            {locale === "ru" ? "Загрузка..." : "Loading..."}
          </p>
        ) : isSuperAdmin ? (
          <div className="space-y-3">
            <label className="block text-xs text-[var(--ink-3)]">
              {t("settings.geminiKey")}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={t("settings.geminiPlaceholder")}
                className="h-10 flex-1 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] placeholder-[var(--ink-4)] outline-none transition-colors focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
              />
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="h-10 rounded-md bg-[var(--m-accent)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-60"
              >
                {saving ? t("settings.saving") : t("common.save")}
              </button>
            </div>
            {message && (
              <p className="text-xs text-[var(--ink-3)]">{message}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-3)]">
            {locale === "ru" ? "API ключ:" : "API key:"}{" "}
            {key ? (
              <span className="text-[var(--ink)]">••••••••</span>
            ) : (
              <span className="text-[var(--ink-4)]">{t("settings.notConfigured")}</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
