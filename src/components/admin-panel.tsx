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
  suspendedAt: string | null;
  propertyCount: number;
  reservationCount: number;
  extractionCount30d: number;
}

interface AdminPlatformRow {
  id: number;
  slug: string;
  displayName: string;
  color: string;
  iconUrl: string | null;
  defaultBufferBefore: number;
  defaultBufferAfter: number;
  importInstructionsKey: string | null;
  exportInstructionsKey: string | null;
  isCustom: boolean;
  enabled: boolean;
  sortOrder: number;
}

interface NewPlatformDraft {
  slug: string;
  displayName: string;
  color: string;
  sortOrder: string;
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

const EMPTY_NEW_PLATFORM: NewPlatformDraft = {
  slug: "",
  displayName: "",
  color: "#6B7280",
  sortOrder: "150",
};

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
  const [suspendingId, setSuspendingId] = useState<number | null>(null);

  const [platforms, setPlatforms] = useState<AdminPlatformRow[]>([]);
  const [platformDrafts, setPlatformDrafts] = useState<Record<string, AdminPlatformRow>>({});
  const [platformsLoading, setPlatformsLoading] = useState(false);
  const [platformsError, setPlatformsError] = useState<string | null>(null);
  const [platformBusy, setPlatformBusy] = useState<string | null>(null);
  const [platformMessage, setPlatformMessage] = useState<{ slug: string; text: string; ok: boolean } | null>(null);
  const [newPlatform, setNewPlatform] = useState<NewPlatformDraft>(EMPTY_NEW_PLATFORM);
  const [creatingPlatform, setCreatingPlatform] = useState(false);
  const [createPlatformError, setCreatePlatformError] = useState<string | null>(null);

  useEffect(() => {
    void load();
    void loadUsers();
    void loadPlatforms();
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

  const toggleSuspend = async (user: AdminUserRow) => {
    const isSuspended = !!user.suspendedAt;
    const verb = isSuspended ? "unsuspend" : "suspend";
    if (!confirm(`${isSuspended ? "Unsuspend" : "Suspend"} ${user.username}?`)) return;
    setSuspendingId(user.id);
    setUsersError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/suspend`, {
        method: isSuspended ? "DELETE" : "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setUsersError(data.error ?? `Failed to ${verb} user`);
        return;
      }
      await loadUsers();
    } finally {
      setSuspendingId(null);
    }
  };

  const loadPlatforms = async () => {
    setPlatformsLoading(true);
    setPlatformsError(null);
    try {
      const res = await fetch("/api/admin/platforms");
      if (!res.ok) {
        setPlatformsError(`Failed to load platforms (${res.status})`);
        return;
      }
      const data = (await res.json()) as AdminPlatformRow[];
      setPlatforms(data);
      const drafts: Record<string, AdminPlatformRow> = {};
      for (const p of data) drafts[p.slug] = { ...p };
      setPlatformDrafts(drafts);
    } catch {
      setPlatformsError("Failed to load platforms");
    } finally {
      setPlatformsLoading(false);
    }
  };

  const platformDirty = (p: AdminPlatformRow): boolean => {
    const draft = platformDrafts[p.slug];
    if (!draft) return false;
    return (
      draft.displayName !== p.displayName ||
      draft.color.toUpperCase() !== p.color.toUpperCase() ||
      draft.sortOrder !== p.sortOrder ||
      draft.enabled !== p.enabled
    );
  };

  const setPlatformDraft = <K extends keyof AdminPlatformRow>(
    slug: string,
    key: K,
    value: AdminPlatformRow[K],
  ) => {
    setPlatformDrafts((d) => ({
      ...d,
      [slug]: { ...d[slug], [key]: value },
    }));
  };

  const savePlatform = async (slug: string) => {
    const draft = platformDrafts[slug];
    if (!draft) return;
    setPlatformBusy(slug);
    setPlatformMessage(null);
    try {
      const res = await fetch(`/api/admin/platforms/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: draft.displayName,
          color: draft.color,
          sortOrder: draft.sortOrder,
          enabled: draft.enabled,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setPlatformMessage({ slug, text: data.error ?? "Failed to save", ok: false });
        return;
      }
      setPlatformMessage({ slug, text: "Saved. Live within 60s.", ok: true });
      await loadPlatforms();
    } finally {
      setPlatformBusy(null);
      setTimeout(() => setPlatformMessage((m) => (m && m.slug === slug ? null : m)), 4000);
    }
  };

  const deletePlatform = async (p: AdminPlatformRow) => {
    if (!confirm(`Delete platform "${p.displayName}" (${p.slug})? This can't be undone.`)) return;
    setPlatformBusy(p.slug);
    setPlatformMessage(null);
    try {
      const res = await fetch(`/api/admin/platforms/${encodeURIComponent(p.slug)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setPlatformMessage({ slug: p.slug, text: data.error ?? "Failed to delete", ok: false });
        return;
      }
      await loadPlatforms();
    } finally {
      setPlatformBusy(null);
    }
  };

  const createPlatform = async () => {
    setCreatingPlatform(true);
    setCreatePlatformError(null);
    try {
      const sortOrderNum = Number(newPlatform.sortOrder);
      const res = await fetch("/api/admin/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newPlatform.slug,
          displayName: newPlatform.displayName,
          color: newPlatform.color,
          sortOrder: Number.isFinite(sortOrderNum) ? sortOrderNum : 150,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setCreatePlatformError(data.error ?? "Failed to create");
        return;
      }
      setNewPlatform(EMPTY_NEW_PLATFORM);
      await loadPlatforms();
    } finally {
      setCreatingPlatform(false);
    }
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((u) => {
                    const isSuspended = !!u.suspendedAt;
                    const isSuperadmin = u.role === "superadmin";
                    return (
                      <TableRow key={u.id} className={isSuspended ? "opacity-60" : ""}>
                        <TableCell className="font-medium">
                          {u.username}
                          {isSuspended && (
                            <span className="ml-2 inline-flex items-center rounded-md bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
                              suspended
                            </span>
                          )}
                        </TableCell>
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
                        <TableCell className="text-right">
                          {!isSuperadmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 rounded-lg px-2 text-xs"
                              onClick={() => void toggleSuspend(u)}
                              disabled={suspendingId === u.id}
                            >
                              {suspendingId === u.id
                                ? "…"
                                : isSuspended
                                  ? "Unsuspend"
                                  : "Suspend"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Admin · Platforms
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={() => void loadPlatforms()}
            disabled={platformsLoading}
          >
            {platformsLoading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/50 p-2">
          {platformsError && (
            <p className="px-3 py-2 text-xs text-destructive">{platformsError}</p>
          )}
          {!platformsError && platforms.length === 0 && !platformsLoading && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No platforms.</p>
          )}
          {platforms.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-right">Sort</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platforms.map((p) => {
                    const draft = platformDrafts[p.slug] ?? p;
                    const dirty = platformDirty(p);
                    const colorValid = HEX_COLOR_RE.test(draft.color);
                    const nameValid =
                      draft.displayName.trim().length > 0 && draft.displayName.length <= 64;
                    const canSave = dirty && colorValid && nameValid;
                    return (
                      <TableRow key={p.slug} className={!draft.enabled ? "opacity-60" : ""}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {p.slug}
                          {p.isCustom && (
                            <span className="ml-2 inline-flex items-center rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                              custom
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={draft.displayName}
                            onChange={(e) =>
                              setPlatformDraft(p.slug, "displayName", e.target.value)
                            }
                            className="h-8 w-40 rounded-lg bg-background/50 text-sm"
                            maxLength={64}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={colorValid ? draft.color : "#6B7280"}
                              onChange={(e) =>
                                setPlatformDraft(p.slug, "color", e.target.value.toUpperCase())
                              }
                              className="h-8 w-8 cursor-pointer rounded-md border border-border/60 bg-transparent"
                              aria-label={`Color for ${p.displayName}`}
                            />
                            <Input
                              value={draft.color}
                              onChange={(e) =>
                                setPlatformDraft(p.slug, "color", e.target.value)
                              }
                              className="h-8 w-24 rounded-lg bg-background/50 font-mono text-xs uppercase"
                              maxLength={7}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={String(draft.sortOrder)}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              if (Number.isFinite(n) && Number.isInteger(n)) {
                                setPlatformDraft(p.slug, "sortOrder", n);
                              }
                            }}
                            className="ml-auto h-8 w-20 rounded-lg bg-background/50 text-right text-sm tabular-nums"
                          />
                        </TableCell>
                        <TableCell>
                          <select
                            value={draft.enabled ? "true" : "false"}
                            onChange={(e) =>
                              setPlatformDraft(p.slug, "enabled", e.target.value === "true")
                            }
                            className="h-8 rounded-lg border border-border/60 bg-background/50 px-2 text-xs"
                          >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 rounded-lg px-2 text-xs"
                              onClick={() => void savePlatform(p.slug)}
                              disabled={!canSave || platformBusy === p.slug}
                            >
                              {platformBusy === p.slug ? "…" : "Save"}
                            </Button>
                            {p.isCustom && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 rounded-lg px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() => void deletePlatform(p)}
                                disabled={platformBusy === p.slug}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                          {platformMessage?.slug === p.slug && (
                            <p
                              className={`mt-1 text-[10px] ${
                                platformMessage.ok ? "text-primary" : "text-destructive"
                              }`}
                            >
                              {platformMessage.text}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-border/60 bg-card/50 p-5">
          <p className="mb-3 text-sm font-medium">Add a custom platform</p>
          <p className="mb-4 text-xs text-muted-foreground/70">
            Use this for platforms not in the built-in list. The slug is permanent — it&apos;s
            baked into the outbound iCal feed URL <code className="font-mono text-[11px]">/for-{`{slug}`}.ics</code>.
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground" htmlFor="np-slug">
                Slug
              </label>
              <Input
                id="np-slug"
                value={newPlatform.slug}
                onChange={(e) => setNewPlatform((s) => ({ ...s, slug: e.target.value }))}
                placeholder="my-platform"
                className="h-9 rounded-lg bg-background/50 font-mono text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground" htmlFor="np-name">
                Display name
              </label>
              <Input
                id="np-name"
                value={newPlatform.displayName}
                onChange={(e) =>
                  setNewPlatform((s) => ({ ...s, displayName: e.target.value }))
                }
                placeholder="My Platform"
                className="h-9 rounded-lg bg-background/50 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground" htmlFor="np-color">
                Color
              </label>
              <input
                id="np-color"
                type="color"
                value={HEX_COLOR_RE.test(newPlatform.color) ? newPlatform.color : "#6B7280"}
                onChange={(e) =>
                  setNewPlatform((s) => ({ ...s, color: e.target.value.toUpperCase() }))
                }
                className="h-9 w-16 cursor-pointer rounded-lg border border-border/60 bg-transparent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground" htmlFor="np-sort">
                Sort
              </label>
              <Input
                id="np-sort"
                type="number"
                value={newPlatform.sortOrder}
                onChange={(e) =>
                  setNewPlatform((s) => ({ ...s, sortOrder: e.target.value }))
                }
                className="h-9 w-20 rounded-lg bg-background/50 text-sm tabular-nums"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => void createPlatform()}
                disabled={
                  creatingPlatform ||
                  newPlatform.slug.trim().length === 0 ||
                  newPlatform.displayName.trim().length === 0
                }
                className="h-9 rounded-lg px-4"
              >
                {creatingPlatform ? "Adding…" : "Add"}
              </Button>
            </div>
          </div>
          {createPlatformError && (
            <p className="mt-2 text-xs text-destructive">{createPlatformError}</p>
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
