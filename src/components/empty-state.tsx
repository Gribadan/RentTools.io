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
    <div className="rounded-lg border border-dashed border-[#333338] bg-[#18181b]/40 p-10 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e1e22] text-[#a0a0a8]">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[#e8e8ec]">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[#71717a]">{description}</p>
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-4 inline-flex h-9 items-center rounded-md bg-[#ff385c] px-4 text-sm font-medium text-white transition-colors hover:bg-[#e0294d]"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
