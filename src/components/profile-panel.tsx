"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { AuditPanel } from "@/components/audit-panel";

interface ProfileUser {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
}

export function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  const { t, locale } = useI18n();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setSuccess(false);
    setCurrentPassword("");
    setNewPassword("");
    setDeleteOpen(false);
    setDeletePassword("");
    setDeleteConfirm("");
    setDeleteError("");
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, [open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed");
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(locale === "ru" ? "ru-RU" : "en", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--ink)]">{t("profile.title")}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--ink-3)] hover:bg-[var(--line-2)] hover:text-[var(--ink)]"
            aria-label={t("profile.close")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-[var(--ink-4)]">{t("profile.username")}</dt>
          <dd className="text-[var(--ink)]">{user?.username ?? "…"}</dd>
          <dt className="text-[var(--ink-4)]">{t("profile.role")}</dt>
          <dd className="text-[var(--ink)]">{user?.role ?? "—"}</dd>
          <dt className="text-[var(--ink-4)]">{t("profile.createdAt")}</dt>
          <dd className="text-[var(--ink)]">{formatDate(user?.createdAt)}</dd>
        </dl>

        <form onSubmit={submit} className="mt-6 space-y-3 border-t border-[var(--line)] pt-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">{t("profile.changePassword")}</h3>
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--ink-3)]" htmlFor="curpw">{t("profile.currentPassword")}</label>
            <input
              id="curpw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-9 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--ink-3)]" htmlFor="newpw">{t("profile.newPassword")}</label>
            <input
              id="newpw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-9 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
              minLength={8}
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-500">{error}</div>
          )}
          {success && (
            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-500">{t("profile.saved")}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-9 w-full rounded-md bg-[var(--m-accent)] text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-50"
          >
            {t("profile.save")}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setAuditOpen(true)}
          className="mt-4 h-9 w-full rounded-md border border-[var(--line-2)] text-sm text-[var(--ink)] transition-colors hover:bg-[var(--line-2)]"
        >
          Recent activity
        </button>

        <button
          type="button"
          onClick={async () => {
            const res = await fetch("/api/auth/export-data");
            if (!res.ok) return;
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `rent-tool-data-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
          className="mt-2 h-9 w-full rounded-md border border-[var(--line-2)] text-sm text-[var(--ink)] transition-colors hover:bg-[var(--line-2)]"
        >
          Download my data
        </button>

        <div className="mt-6 border-t border-[var(--line)] pt-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Danger zone</h3>
          <p className="mt-1 text-xs text-[var(--ink-3)]">
            Permanently delete your account and every property, reservation, guest,
            and log we hold. This cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="mt-3 h-9 w-full rounded-md border border-rose-500/40 text-sm text-rose-500 transition-colors hover:bg-rose-500/10"
          >
            Delete my account
          </button>
        </div>
      </div>

      {deleteOpen && user && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-[var(--ink)]">Delete account</h3>
            <p className="mt-2 text-sm text-[var(--ink-3)]">
              Type your username <span className="font-mono text-[var(--ink)]">{user.username}</span>{" "}
              and your current password to confirm. We will immediately remove all your
              properties, reservations, guests, calendar links, message templates, cleaning
              records, and audit history. You will be logged out.
            </p>

            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--ink-3)]" htmlFor="del-confirm">
                  Confirm username
                </label>
                <input
                  id="del-confirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="h-9 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-rose-500"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--ink-3)]" htmlFor="del-pw">
                  Current password
                </label>
                <input
                  id="del-pw"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="h-9 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-rose-500"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {deleteError && (
              <div className="mt-3 rounded-md bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-500">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleteBusy}
                className="h-9 flex-1 rounded-md border border-[var(--line-2)] text-sm text-[var(--ink)] transition-colors hover:bg-[var(--line-2)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  deleteBusy ||
                  deleteConfirm !== user.username ||
                  deletePassword.length === 0
                }
                onClick={async () => {
                  setDeleteBusy(true);
                  setDeleteError("");
                  try {
                    const res = await fetch("/api/auth/delete-account", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        password: deletePassword,
                        confirmUsername: deleteConfirm,
                      }),
                    });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      setDeleteError(data.error || "Failed to delete");
                      return;
                    }
                    window.location.href = "/login";
                  } finally {
                    setDeleteBusy(false);
                  }
                }}
                className="h-9 flex-1 rounded-md bg-rose-500 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
              >
                {deleteBusy ? "Deleting…" : "Permanently delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AuditPanel open={auditOpen} onClose={() => setAuditOpen(false)} />
    </div>
  );
}
