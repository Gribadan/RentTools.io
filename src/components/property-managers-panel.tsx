"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface CopyShape {
  dateLocale: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: { dateLocale: "en-GB" },
  ru: { dateLocale: "ru-RU" },
  de: { dateLocale: "de-DE" },
  fr: { dateLocale: "fr-FR" },
  es: { dateLocale: "es-ES" },
};

interface Manager {
  id: number;
  managerId: number;
  username: string;
  role: string;
  createdAt: string;
}

interface Invite {
  id: number;
  token: string;
  expiresAt: string;
  createdAt: string;
}

interface SessionInfo {
  userId: number;
  username: string;
}

interface PropertyManagersPanelProps {
  propertyId: number;
  ownerUserId: number;
  ownerUsername?: string;
}

function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function PropertyManagersPanel({ propertyId, ownerUserId, ownerUsername }: PropertyManagersPanelProps) {
  const { t, locale } = useI18n();
  const c = COPY[locale];
  const [managers, setManagers] = useState<Manager[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, iRes] = await Promise.all([
        fetch(`/api/property-managers?propertyId=${propertyId}`),
        fetch(`/api/property-manager-invites?propertyId=${propertyId}`),
      ]);

      if (mRes.status === 404 || iRes.status === 404) {
        setForbidden(true);
        setManagers([]);
        setInvites([]);
        return;
      }
      if (!mRes.ok) throw new Error(`HTTP ${mRes.status}`);
      const mData = await mRes.json();
      setManagers(mData || []);

      if (iRes.ok) {
        const iData = await iRes.json();
        setInvites(iData || []);
      }
      setForbidden(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSession(data?.user || null))
      .catch(() => setSession(null));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isOwner = !!session && session.userId === ownerUserId;

  const handleGenerate = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/property-manager-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
        return;
      }
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (inviteId: number) => {
    if (!confirm(t("managers.confirmRevoke"))) return;
    setError(null);
    try {
      const res = await fetch(
        `/api/property-manager-invites?id=${inviteId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `HTTP ${res.status}`);
        return;
      }
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke");
    }
  };

  const handleRemove = async (managerId: number) => {
    if (!confirm(t("managers.confirmRemove"))) return;
    setError(null);
    try {
      const res = await fetch(
        `/api/property-managers?propertyId=${propertyId}&managerId=${managerId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `HTTP ${res.status}`);
        return;
      }
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove");
    }
  };

  const inviteUrl = (token: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/invite/${token}`;
  };

  const handleCopy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      // fallback: select-and-copy via prompt
      window.prompt("Copy link", inviteUrl(token));
    }
  };

  // Non-owners see informational notice (managers can't manage other managers)
  if (forbidden || (!isOwner && session)) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-4 space-y-2">
        <h2 className="text-sm font-semibold text-[var(--ink)]">{t("managers.title")}</h2>
        <p className="text-xs text-[var(--ink-3)]">{t("managers.ownerOnly")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)] p-4 space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-[var(--ink)]">{t("managers.title")}</h2>
        <p className="text-xs text-[var(--ink-3)]">{t("managers.desc")}</p>
      </div>

      {/* Owner row + manager list */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 shrink-0 rounded-full bg-[var(--m-accent)]/20 flex items-center justify-center text-[11px] font-bold text-[var(--m-accent)] uppercase">
              {(ownerUsername?.[0] || "O")}
            </div>
            <div>
              <div className="text-sm text-[var(--ink)]">
                {ownerUsername || `user ${ownerUserId}`}
                {isOwner && <span className="ml-1.5 text-[10px] text-[var(--ink-4)]">({t("managers.you")})</span>}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-[var(--ink-4)]">{t("managers.owner")}</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="px-3 py-2 text-xs text-[var(--ink-4)]">…</div>
        ) : managers.length === 0 ? (
          <p className="px-3 py-2 text-xs text-[var(--ink-4)]">{t("managers.empty")}</p>
        ) : (
          managers.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 shrink-0 rounded-full bg-[var(--line-2)] flex items-center justify-center text-[11px] font-bold text-[var(--ink-2)] uppercase">
                  {m.username[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-[var(--ink)] truncate">{m.username}</div>
                  <div className="text-[11px] text-[var(--ink-4)]">
                    {new Date(m.createdAt).toLocaleDateString(c.dateLocale)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRemove(m.managerId)}
                className="rounded-md p-1.5 text-[var(--ink-4)] hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                title={t("common.remove")}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wide text-[var(--ink-4)]">
            {t("managers.pendingInvites")} ({invites.length})
          </div>
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 space-y-1.5"
            >
              <div className="flex items-center gap-1.5">
                <code className="flex-1 truncate rounded bg-[var(--bg)] px-2 py-1 text-[11px] text-[var(--ink-3)]">
                  {inviteUrl(inv.token)}
                </code>
                <button
                  onClick={() => handleCopy(inv.token)}
                  className="shrink-0 rounded-md bg-[var(--line-2)] px-2 py-1 text-[11px] text-[var(--ink-2)] hover:bg-[var(--line-2)]"
                >
                  {copiedToken === inv.token ? t("managers.linkCopied") : t("managers.copyLink")}
                </button>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  className="shrink-0 rounded-md p-1.5 text-[var(--ink-4)] hover:bg-rose-500/10 hover:text-rose-500"
                  title={t("managers.revokeInvite")}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-[11px] text-[var(--ink-4)]">
                {t("managers.expiresIn", { n: daysUntil(inv.expiresAt) })}
              </div>
            </div>
          ))}
          <p className="px-1 text-[11px] text-[var(--ink-4)]">{t("managers.inviteCreated")}</p>
        </div>
      )}

      {/* Generate invite button */}
      <button
        onClick={handleGenerate}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--m-accent)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-40"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
        {submitting ? t("managers.generating") : t("managers.generateInvite")}
      </button>

      {error && (
        <div className="rounded-md bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-500">
          {error}
        </div>
      )}
    </div>
  );
}
