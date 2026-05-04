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
      <div className="w-full max-w-xl rounded-2xl border border-[#27272b] bg-[#18181b] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#e8e8ec]">Recent activity</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#a0a0a8] hover:bg-[#27272b] hover:text-[#e8e8ec]"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-sm text-[#71717a]">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#71717a]">No activity yet.</div>
          ) : (
            <ul className="space-y-1.5">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-[#27272b] bg-[#111113] px-3 py-2 text-xs"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase " +
                        (e.action === "create"
                          ? "bg-[#34d399]/15 text-[#34d399]"
                          : e.action === "delete"
                          ? "bg-[#ef4444]/15 text-[#ef4444]"
                          : "bg-[#60a5fa]/15 text-[#60a5fa]")
                      }
                    >
                      {e.action}
                    </span>
                    <span className="shrink-0 text-[#a0a0a8]">{e.resourceType}</span>
                    <span className="truncate text-[#e8e8ec]">{summarize(e)}</span>
                  </div>
                  <span className="shrink-0 text-[#71717a]">{formatDate(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
