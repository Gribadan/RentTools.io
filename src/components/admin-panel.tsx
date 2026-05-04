"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SiteSettingRow {
  value: string;
  updatedAt: string | null;
}

type SiteSettingsMap = Record<string, SiteSettingRow>;

const FIELDS: Array<{
  key: string;
  label: string;
  hint: string;
  type: "toggle" | "number" | "text" | "email";
  defaultValue: string;
}> = [
  {
    key: "signup_enabled",
    label: "Public signup",
    hint: "Toggle whether new accounts can be created.",
    type: "toggle",
    defaultValue: "true",
  },
  {
    key: "extraction_per_user_daily_limit",
    label: "Daily extraction quota (per user)",
    hint: "Max passport extractions one user may run in 24h. 0 disables the limit.",
    type: "number",
    defaultValue: "20",
  },
  {
    key: "landing_announcement",
    label: "Landing announcement banner",
    hint: "Short message shown at the top of the public landing page. Leave empty to hide.",
    type: "text",
    defaultValue: "",
  },
  {
    key: "support_email",
    label: "Support email",
    hint: "Public contact address surfaced in landing/footer/help.",
    type: "email",
    defaultValue: "",
  },
];

export function AdminPanel() {
  const [settings, setSettings] = useState<SiteSettingsMap>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ key: string; text: string; ok: boolean } | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void load();
  }, []);

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
      setMessage({ key, text: "Saved. Cached settings refresh within 60s.", ok: true });
      await load();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage({ key, text: data.error ?? "Failed to save", ok: false });
    }
    setTimeout(() => setMessage((m) => (m && m.key === key ? null : m)), 4000);
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/export-my-data");
      if (!res.ok) {
        setExporting(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rent-tool-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Admin · Site settings
        </h2>
        <div className="space-y-3 rounded-xl border border-border/60 bg-card/50 p-5">
          {FIELDS.map((f) => {
            const draft = drafts[f.key] ?? f.defaultValue;
            const saved = settings[f.key]?.value ?? f.defaultValue;
            const dirty = draft !== saved;
            return (
              <div key={f.key} className="grid gap-2 border-b border-border/30 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <label className="block text-sm font-medium" htmlFor={`ss-${f.key}`}>
                    {f.label}
                  </label>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">{f.hint}</p>
                  {message?.key === f.key && (
                    <p className={`mt-1 text-xs ${message.ok ? "text-primary" : "text-destructive"}`}>
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
                      className="h-10 rounded-xl border border-border/60 bg-background/50 px-3 text-sm"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  ) : (
                    <Input
                      id={`ss-${f.key}`}
                      type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
                      value={draft}
                      onChange={(e) => setDrafts((d) => ({ ...d, [f.key]: e.target.value }))}
                      className="h-10 w-64 rounded-xl bg-background/50 text-sm"
                    />
                  )}
                  <Button
                    onClick={() => saveKey(f.key, draft)}
                    disabled={!dirty || savingKey === f.key}
                    className="h-10 rounded-xl px-4"
                  >
                    {savingKey === f.key ? "Saving" : "Save"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Admin · System status
        </h2>
        <div className="flex flex-wrap gap-2 rounded-xl border border-border/60 bg-card/50 p-5 text-sm">
          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 hover:bg-background"
          >
            App health → /api/health
          </a>
          <a
            href="/api/calendar/health"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 hover:bg-background"
          >
            Calendar sync health → /api/calendar/health
          </a>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Admin · Data export
        </h2>
        <div className="rounded-xl border border-border/60 bg-card/50 p-5">
          <p className="mb-3 text-sm text-muted-foreground">
            Download a JSON dump of your own properties, reservations, guests, calendar links, message
            templates, and cleaning records. Useful as a personal backup.
          </p>
          <Button onClick={exportData} disabled={exporting} className="h-10 rounded-xl px-5">
            {exporting ? "Preparing…" : "Download JSON"}
          </Button>
        </div>
      </section>
    </div>
  );
}
