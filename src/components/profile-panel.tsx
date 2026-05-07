"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import { AuditPanel } from "@/components/audit-panel";

interface CopyShape {
  dateLocale: string;
  subtitle: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    dateLocale: "en",
    subtitle: "Personal info, password, and activity.",
  },
  ru: {
    dateLocale: "ru-RU",
    subtitle: "Личные данные, пароль и активность.",
  },
  de: {
    dateLocale: "de-DE",
    subtitle: "Persönliche Daten, Passwort und Aktivität.",
  },
  fr: {
    dateLocale: "fr-FR",
    subtitle: "Informations personnelles, mot de passe et activité.",
  },
};

interface ProfileUser {
  id: number;
  username: string;
  role: string;
  createdAt: string;
  tgGroupInviteUrl: string | null;
  waGroupInviteUrl: string | null;
}

type InviteSaveState = "idle" | "saving" | "saved" | "error";

// Renders as a routed dashboard view (no modal overlay) — was a drawer
// but felt like a popup. Lives at activeView === "profile" inside the
// dashboard shell.
export function ProfilePanel() {
  const { t: tr, locale } = useI18n();
  const c = COPY[locale];
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
  // RT-25.13 tick 2 — host-managed messenger group invite URLs.
  const [tgInviteDraft, setTgInviteDraft] = useState("");
  const [waInviteDraft, setWaInviteDraft] = useState("");
  const [tgInviteState, setTgInviteState] = useState<InviteSaveState>("idle");
  const [waInviteState, setWaInviteState] = useState<InviteSaveState>("idle");
  const [tgInviteError, setTgInviteError] = useState("");
  const [waInviteError, setWaInviteError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user ?? null;
        setUser(u);
        if (u) {
          setTgInviteDraft(u.tgGroupInviteUrl ?? "");
          setWaInviteDraft(u.waGroupInviteUrl ?? "");
        }
      })
      .catch(() => setUser(null));
  }, []);

  const saveInvite = async (
    field: "tgGroupInviteUrl" | "waGroupInviteUrl",
    raw: string,
  ) => {
    const isTg = field === "tgGroupInviteUrl";
    const setState = isTg ? setTgInviteState : setWaInviteState;
    const setErr = isTg ? setTgInviteError : setWaInviteError;
    const trimmed = raw.trim();
    const previous = isTg ? user?.tgGroupInviteUrl ?? "" : user?.waGroupInviteUrl ?? "";
    if (trimmed === previous) {
      setState("idle");
      setErr("");
      return;
    }
    setState("saving");
    setErr("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: trimmed === "" ? null : trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || (isTg ? tr("profile.invitesInvalidTg") : tr("profile.invitesInvalidWa")));
        setState("error");
        return;
      }
      const data = await res.json();
      setUser(data.user ?? null);
      setState("saved");
      setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 1800);
    } catch {
      setErr(isTg ? tr("profile.invitesInvalidTg") : tr("profile.invitesInvalidWa"));
      setState("error");
    }
  };

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
    return new Date(iso).toLocaleDateString(c.dateLocale, {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] p-6 shadow-sm">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-[var(--ink)]">{tr("profile.title")}</h1>
          <p className="mt-0.5 text-sm text-[var(--ink-3)]">
            {c.subtitle}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-[var(--ink-4)]">{tr("profile.username")}</dt>
          <dd className="text-[var(--ink)]">{user?.username ?? "…"}</dd>
          <dt className="text-[var(--ink-4)]">{tr("profile.role")}</dt>
          <dd className="text-[var(--ink)]">{user?.role ?? "—"}</dd>
          <dt className="text-[var(--ink-4)]">{tr("profile.createdAt")}</dt>
          <dd className="text-[var(--ink)]">{formatDate(user?.createdAt)}</dd>
        </dl>

        <form onSubmit={submit} className="mt-6 space-y-3 border-t border-[var(--line)] pt-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">{tr("profile.changePassword")}</h3>
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--ink-3)]" htmlFor="curpw">{tr("profile.currentPassword")}</label>
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
            <label className="text-xs text-[var(--ink-3)]" htmlFor="newpw">{tr("profile.newPassword")}</label>
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
            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-500">{tr("profile.saved")}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-9 w-full rounded-md bg-[var(--m-accent)] text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-50"
          >
            {tr("profile.save")}
          </button>
        </form>

        {/* RT-25.13 tick 2 — Messenger group invite URLs. Save on blur;
            an empty value clears the field (the per-reservation CTA hides
            unless at least one platform has a URL saved). */}
        <div className="mt-6 space-y-3 border-t border-[var(--line)] pt-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--ink)]">{tr("profile.messengerInvites")}</h3>
            <p className="mt-1 text-xs text-[var(--ink-3)]">{tr("profile.messengerInvitesHint")}</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--ink-3)]" htmlFor="tg-invite">
                {tr("profile.tgInviteUrl")}
              </label>
              <span
                className={`text-[10px] transition-opacity ${
                  tgInviteState === "idle" ? "opacity-0" : "opacity-100"
                } ${
                  tgInviteState === "saved"
                    ? "text-emerald-500"
                    : tgInviteState === "error"
                      ? "text-rose-500"
                      : "text-[var(--ink-3)]"
                }`}
              >
                {tgInviteState === "saving"
                  ? tr("profile.invitesSaving")
                  : tgInviteState === "saved"
                    ? tr("profile.invitesSaved")
                    : tgInviteState === "error"
                      ? tgInviteError
                      : ""}
              </span>
            </div>
            <input
              id="tg-invite"
              type="url"
              value={tgInviteDraft}
              onChange={(e) => {
                setTgInviteDraft(e.target.value);
                if (tgInviteState === "saved" || tgInviteState === "error") setTgInviteState("idle");
              }}
              onBlur={() => saveInvite("tgGroupInviteUrl", tgInviteDraft)}
              placeholder={tr("profile.tgInvitePlaceholder")}
              className="h-9 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--ink-3)]" htmlFor="wa-invite">
                {tr("profile.waInviteUrl")}
              </label>
              <span
                className={`text-[10px] transition-opacity ${
                  waInviteState === "idle" ? "opacity-0" : "opacity-100"
                } ${
                  waInviteState === "saved"
                    ? "text-emerald-500"
                    : waInviteState === "error"
                      ? "text-rose-500"
                      : "text-[var(--ink-3)]"
                }`}
              >
                {waInviteState === "saving"
                  ? tr("profile.invitesSaving")
                  : waInviteState === "saved"
                    ? tr("profile.invitesSaved")
                    : waInviteState === "error"
                      ? waInviteError
                      : ""}
              </span>
            </div>
            <input
              id="wa-invite"
              type="url"
              value={waInviteDraft}
              onChange={(e) => {
                setWaInviteDraft(e.target.value);
                if (waInviteState === "saved" || waInviteState === "error") setWaInviteState("idle");
              }}
              onBlur={() => saveInvite("waGroupInviteUrl", waInviteDraft)}
              placeholder={tr("profile.waInvitePlaceholder")}
              className="h-9 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            />
          </div>
        </div>

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
