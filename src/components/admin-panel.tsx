"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SiteSettingRow {
  value: string;
  updatedAt: string | null;
}

type SiteSettingsMap = Record<string, SiteSettingRow>;

interface AdminUserRow {
  id: number;
  username: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  propertyCount: number;
  reservationCount: number;
  extractionCount30d: number;
}

type SortKey =
  | "username"
  | "role"
  | "createdAt"
  | "propertyCount"
  | "reservationCount"
  | "extractionCount30d"
  | "lastLoginAt";
type SortDir = "asc" | "desc";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

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

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    void load();
    void loadUsers();
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

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        setUsersError(`Failed to load users (${res.status})`);
        return;
      }
      const data = (await res.json()) as AdminUserRow[];
      setUsers(data);
    } catch {
      setUsersError("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "username" || key === "role" ? "asc" : "desc");
    }
  };

  const sortedUsers = useMemo(() => {
    const copy = [...users];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (av === null && bv === null) cmp = 0;
      else if (av === null) cmp = -1;
      else if (bv === null) cmp = 1;
      else if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [users, sortKey, sortDir]);

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Admin · Users
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={() => void loadUsers()}
            disabled={usersLoading}
          >
            {usersLoading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/50 p-2">
          {usersError && (
            <p className="px-3 py-2 text-xs text-destructive">{usersError}</p>
          )}
          {!usersError && users.length === 0 && !usersLoading && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No users yet.</p>
          )}
          {users.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort("username")}
                    >
                      Username{sortIndicator("username")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort("role")}
                    >
                      Role{sortIndicator("role")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort("createdAt")}
                    >
                      Signup{sortIndicator("createdAt")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => toggleSort("propertyCount")}
                    >
                      Properties{sortIndicator("propertyCount")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => toggleSort("reservationCount")}
                    >
                      Reservations{sortIndicator("reservationCount")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => toggleSort("extractionCount30d")}
                    >
                      Extractions 30d{sortIndicator("extractionCount30d")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort("lastLoginAt")}
                    >
                      Last login{sortIndicator("lastLoginAt")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell className="text-muted-foreground">{u.role}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {u.propertyCount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {u.reservationCount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {u.extractionCount30d}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(u.lastLoginAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
