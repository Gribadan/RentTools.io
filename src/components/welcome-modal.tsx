"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  onAddProperty: (name: string) => Promise<void> | void;
}

export function WelcomeModal({ open, onClose, onAddProperty }: WelcomeModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [showInput, setShowInput] = useState(false);

  if (!open) return null;

  const dismiss = () => {
    try {
      localStorage.setItem("welcome-modal-dismissed", "1");
    } catch {}
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onAddProperty(name.trim());
      dismiss();
    } finally {
      setBusy(false);
    }
  };

  const handleSample = async () => {
    setBusy(true);
    try {
      // Prefer the dedicated sample endpoint (RT-8.2). Fall back to a plain
      // "Sample Apartment" property if that endpoint isn't deployed yet.
      const res = await fetch("/api/properties/sample", { method: "POST" });
      if (!res.ok) {
        await onAddProperty("Sample Apartment");
      }
      dismiss();
      // Trigger any parent listeners by reloading data; the parent's onAddProperty
      // already calls fetchProperties on the plain-fallback path.
      if (res.ok) {
        // best-effort full refresh to pick up sample reservations created server-side
        window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-[var(--ink)]">{t("welcome.title")}</h2>
        <p className="mt-1 text-sm text-[var(--ink-3)]">{t("welcome.subtitle")}</p>

        <div className="mt-5 space-y-3">
          {showInput ? (
            <div className="space-y-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("welcome.namePlaceholder")}
                className="h-9 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] placeholder-[var(--ink-4)] outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)]"
              />
              <button
                onClick={handleCreate}
                disabled={busy || !name.trim()}
                className="h-9 w-full rounded-md bg-[var(--m-accent)] text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-50"
              >
                {t("welcome.create")}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              disabled={busy}
              className="h-10 w-full rounded-md bg-[var(--m-accent)] text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)] disabled:opacity-50"
            >
              {t("welcome.addFirst")}
            </button>
          )}

          <button
            onClick={handleSample}
            disabled={busy}
            className="h-10 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--bg-3)] disabled:opacity-50"
          >
            {t("welcome.useSample")}
          </button>
        </div>

        <button
          onClick={dismiss}
          disabled={busy}
          className="mt-4 w-full text-center text-xs text-[var(--ink-4)] hover:text-[var(--ink-3)] disabled:opacity-50"
        >
          {t("welcome.dismiss")}
        </button>
      </div>
    </div>
  );
}
