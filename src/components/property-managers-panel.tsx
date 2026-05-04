"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

interface Manager {
  id: number;
  managerId: number;
  username: string;
  role: string;
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

export function PropertyManagersPanel({ propertyId, ownerUserId, ownerUsername }: PropertyManagersPanelProps) {
  const { t, locale } = useI18n();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/property-managers?propertyId=${propertyId}`);
      if (res.status === 404) {
        // User isn't owner of this property — can't see/manage managers
        setForbidden(true);
        setManagers([]);
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setManagers(data || []);
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
    fetchManagers();
  }, [fetchManagers]);

  const isOwner = !!session && session.userId === ownerUserId;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/property-managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, username: newUsername.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
        return;
      }
      setNewUsername("");
      await fetchManagers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSubmitting(false);
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
      await fetchManagers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove");
    }
  };

  // For non-owners, show an informational notice instead of hiding entirely
  // (the user might be a manager themselves and want to know who else is)
  if (forbidden) {
    return (
      <div className="rounded-lg border border-[#27272b] bg-[#18181b] p-4 space-y-2">
        <h2 className="text-sm font-semibold text-[#e8e8ec]">{t("managers.title")}</h2>
        <p className="text-xs text-[#a0a0a8]">{t("managers.ownerOnly")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#27272b] bg-[#18181b] p-4 space-y-3">
      <h2 className="text-sm font-semibold text-[#e8e8ec]">{t("managers.title")}</h2>
      <p className="text-xs text-[#a0a0a8]">{t("managers.desc")}</p>

      {/* Owner row + manager list */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between rounded-md border border-[#27272b] bg-[#111113] px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 shrink-0 rounded-full bg-[#ff385c]/20 flex items-center justify-center text-[11px] font-bold text-[#ff385c] uppercase">
              {(ownerUsername?.[0] || "O")}
            </div>
            <div>
              <div className="text-sm text-[#e8e8ec]">
                {ownerUsername || `user ${ownerUserId}`}
                {isOwner && <span className="ml-1.5 text-[10px] text-[#71717a]">({t("managers.you")})</span>}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-[#71717a]">{t("managers.owner")}</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="px-3 py-2 text-xs text-[#71717a]">…</div>
        ) : managers.length === 0 ? (
          <p className="px-3 py-2 text-xs text-[#71717a]">{t("managers.empty")}</p>
        ) : (
          managers.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-md border border-[#27272b] bg-[#111113] px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 shrink-0 rounded-full bg-[#27272b] flex items-center justify-center text-[11px] font-bold text-[#d4d4d8] uppercase">
                  {m.username[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-[#e8e8ec] truncate">{m.username}</div>
                  <div className="text-[11px] text-[#71717a]">
                    {new Date(m.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB")}
                  </div>
                </div>
              </div>
              {isOwner && (
                <button
                  onClick={() => handleRemove(m.managerId)}
                  className="rounded-md p-1.5 text-[#71717a] hover:bg-[#ef4444]/10 hover:text-[#ef4444] transition-colors"
                  title={t("common.remove")}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add form (owner only) */}
      {isOwner && (
        <form onSubmit={handleAdd} className="flex gap-2 pt-1">
          <input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder={t("managers.addPlaceholder")}
            className="h-8 flex-1 rounded-md border border-[#333338] bg-[#111113] px-3 text-sm text-[#e8e8ec] placeholder-[#71717a] outline-none focus:border-[#e8e8ec]"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={!newUsername.trim() || submitting}
            className="h-8 rounded-md bg-[#ff385c] px-3 text-xs font-medium text-white transition-colors hover:bg-[#e0294d] disabled:opacity-40"
          >
            {t("managers.add")}
          </button>
        </form>
      )}

      {!isOwner && session && (
        <p className="text-xs text-[#71717a]">{t("managers.ownerOnly")}</p>
      )}

      {error && (
        <div className="rounded-md bg-[#ef4444]/10 border border-[#ef4444]/20 px-3 py-2 text-xs text-[#ef4444]">
          {error}
        </div>
      )}
    </div>
  );
}
