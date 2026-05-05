"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

interface AuditEntry {
  id: number;
  action: string;
  resourceType: string;
  resourceId: number;
  payload: string | null;
  createdAt: string;
}

interface AuditPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AuditPanel({ open, onClose }: AuditPanelProps) {
  const { locale } = useI18n();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/audit")
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data) => setEntries(Array.isArray(data?.entries) ? data.entries : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(locale === "ru" ? "ru-RU" : "en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const summarize = (e: AuditEntry): string => {
    if (!e.payload) return `#${e.resourceId}`;
    try {
      const obj = JSON.parse(e.payload) as Record<string, unknown>;
      const keys = Object.keys(obj).filter((k) => obj[k] !== undefined);
      if (keys.length === 0) return `#${e.resourceId}`;
      const head = keys.slice(0, 3).join(", ");
      return `#${e.resourceId} · ${head}`;
    } catch {
      return `#${e.resourceId}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Recent activity</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--ink-3)] hover:bg-[var(--line-2)] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-sm text-[var(--ink-4)]">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--ink-4)]">No activity yet.</div>
          ) : (
            <ul className="space-y-1.5">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase " +
                        (e.action === "create"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : e.action === "delete"
                          ? "bg-rose-500/15 text-rose-500"
                          : "bg-sky-400/15 text-sky-400")
                      }
                    >
                      {e.action}
                    </span>
                    <span className="shrink-0 text-[var(--ink-3)]">{e.resourceType}</span>
                    <span className="truncate text-[var(--ink)]">{summarize(e)}</span>
                  </div>
                  <span className="shrink-0 text-[var(--ink-4)]">{formatDate(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
