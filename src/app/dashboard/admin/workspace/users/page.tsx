"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

// RT-25.9 tick 5 — Users & roles sub-route at
// /dashboard/admin/workspace/users. Migrates the User Management
// section from settings-panel.tsx. SettingsPanel keeps its own copy
// rendered until the SettingsPanel removal sweep ships, so the legacy
// ?view=settings surface continues to work.

interface MeResponse {
  user?: { id: number; username: string; role: string } | null;
}

interface User {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

interface CopyShape {
  failedToAdd: string;
  subtitle: string;
  loading: string;
  empty: string;
  dateLocale: string;
  deleteUser: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    failedToAdd: "Failed to add user",
    subtitle: "Admins and managers of this instance. Cleaners are added per-property via the cleaner cards.",
    loading: "Loading...",
    empty: "No users yet.",
    dateLocale: "en-GB",
    deleteUser: "Delete user",
  },
  ru: {
    failedToAdd: "Не удалось добавить",
    subtitle: "Администраторы и менеджеры этого инстанса. Уборщики добавляются через карточки уборщиков на странице объекта.",
    loading: "Загрузка...",
    empty: "Пользователей пока нет.",
    dateLocale: "ru-RU",
    deleteUser: "Удалить пользователя",
  },
  de: {
    failedToAdd: "Benutzer konnte nicht hinzugefügt werden",
    subtitle: "Administratoren und Manager dieser Instanz. Reinigungskräfte werden pro Objekt über die Reinigungskarten hinzugefügt.",
    loading: "Wird geladen...",
    empty: "Noch keine Benutzer.",
    dateLocale: "de-DE",
    deleteUser: "Benutzer löschen",
  },
};

export default function AdminUsersPage() {
  const { t: tr, locale } = useI18n();
  const t = COPY[locale];
  const [role, setRole] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? (r.json() as Promise<MeResponse>) : null))
      .then((data) => setRole(data?.user?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  const loadUsers = () => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (Array.isArray(rows)) setUsers(rows);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      if (res.ok) {
        setNewUsername("");
        setNewPassword("");
        loadUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || t.failedToAdd);
      }
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async (id: number) => {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    loadUsers();
  };

  const isSuperAdmin = role === "superadmin";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {tr("settings.users")}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {t.subtitle}
        </p>
      </div>

      {isSuperAdmin && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5">
          <form onSubmit={addUser} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder={tr("settings.username")}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="h-10 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] placeholder-[var(--ink-4)] outline-none transition-colors focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                required
              />
              <input
                type="password"
                placeholder={tr("settings.passwordLabel")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] placeholder-[var(--ink-4)] outline-none transition-colors focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]/30"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={busy}
                className="h-10 rounded-md bg-[var(--m-accent)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-60"
              >
                {tr("settings.addUser")}
              </button>
              {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-2)]">
        {!loaded ? (
          <div className="p-5 text-sm text-[var(--ink-4)]">
            {t.loading}
          </div>
        ) : users.length === 0 ? (
          <div className="p-5 text-sm text-[var(--ink-4)]">
            {t.empty}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                <th className="px-4 py-2.5">{tr("settings.username")}</th>
                <th className="px-4 py-2.5">{tr("settings.role")}</th>
                <th className="px-4 py-2.5">{tr("settings.created")}</th>
                {isSuperAdmin && <th className="w-10 px-2" />}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  className={i < users.length - 1 ? "border-b border-[var(--line)]/50" : ""}
                >
                  <td className="px-4 py-3 font-medium text-[var(--ink)]">{u.username}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        u.role === "superadmin"
                          ? "bg-[var(--m-accent)]/15 text-[var(--m-accent)]"
                          : "bg-[var(--bg-3)] text-[var(--ink-2)]"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-3)]">
                    {new Date(u.createdAt).toLocaleDateString(t.dateLocale, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-2 py-3 text-right">
                      {u.role !== "superadmin" && (
                        <button
                          type="button"
                          onClick={() => deleteUser(u.id)}
                          className="rounded-md p-1.5 text-[var(--ink-4)] transition-all hover:bg-rose-500/15 hover:text-rose-400"
                          aria-label={t.deleteUser}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
