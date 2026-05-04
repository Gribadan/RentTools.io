"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111113] p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ef4444]/10">
          <svg className="h-8 w-8 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-[#e8e8ec]">Something went wrong</h1>
        <p className="mb-2 text-sm text-[#a0a0a8]">
          An unexpected error occurred. We&apos;ve been notified.
        </p>
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-[#71717a]">Error ID: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-[#ff385c] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#e0294d]"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-[#27272b] px-5 py-2.5 text-sm font-medium text-[#d4d4d8] transition-colors hover:bg-[#1e1e22]"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
