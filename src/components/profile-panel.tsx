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

  useEffect(() => {
    if (!open) return;
    setError("");
    setSuccess(false);
    setCurrentPassword("");
    setNewPassword("");
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
      <div className="w-full max-w-md rounded-2xl border border-[#27272b] bg-[#18181b] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#e8e8ec]">{t("profile.title")}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#a0a0a8] hover:bg-[#27272b] hover:text-[#e8e8ec]"
            aria-label={t("profile.close")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-[#71717a]">{t("profile.username")}</dt>
          <dd className="text-[#e8e8ec]">{user?.username ?? "…"}</dd>
          <dt className="text-[#71717a]">{t("profile.role")}</dt>
          <dd className="text-[#e8e8ec]">{user?.role ?? "—"}</dd>
          <dt className="text-[#71717a]">{t("profile.createdAt")}</dt>
          <dd className="text-[#e8e8ec]">{formatDate(user?.createdAt)}</dd>
        </dl>

        <form onSubmit={submit} className="mt-6 space-y-3 border-t border-[#27272b] pt-4">
          <h3 className="text-sm font-semibold text-[#e8e8ec]">{t("profile.changePassword")}</h3>
          <div className="space-y-1.5">
            <label className="text-xs text-[#a0a0a8]" htmlFor="curpw">{t("profile.currentPassword")}</label>
            <input
              id="curpw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-9 w-full rounded-md border border-[#333338] bg-[#111113] px-3 text-sm text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#a0a0a8]" htmlFor="newpw">{t("profile.newPassword")}</label>
            <input
              id="newpw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-9 w-full rounded-md border border-[#333338] bg-[#111113] px-3 text-sm text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
              minLength={8}
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-[#ef4444]/10 border border-[#ef4444]/20 px-3 py-2 text-xs text-[#ef4444]">{error}</div>
          )}
          {success && (
            <div className="rounded-md bg-[#34d399]/10 border border-[#34d399]/20 px-3 py-2 text-xs text-[#34d399]">{t("profile.saved")}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-9 w-full rounded-md bg-[#ff385c] text-sm font-medium text-white transition-colors hover:bg-[#e0294d] disabled:opacity-50"
          >
            {t("profile.save")}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setAuditOpen(true)}
          className="mt-4 h-9 w-full rounded-md border border-[#333338] text-sm text-[#e8e8ec] transition-colors hover:bg-[#27272b]"
        >
          Recent activity
        </button>
      </div>
      <AuditPanel open={auditOpen} onClose={() => setAuditOpen(false)} />
    </div>
  );
}
