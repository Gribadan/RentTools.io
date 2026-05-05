"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  cta?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, cta }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--line-2)] bg-[var(--bg-2)]/40 p-10 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-3)] text-[var(--ink-3)]">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--ink-4)]">{description}</p>
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-4 inline-flex h-9 items-center rounded-md bg-[var(--m-accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)]"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
