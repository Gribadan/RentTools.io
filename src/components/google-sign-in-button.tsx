"use client";

import { useEffect, useState } from "react";

interface Props {
  /** Optional same-origin path the user lands on after a successful sign-in. */
  next?: string;
  /** Localised label, e.g. "Continue with Google" / "Войти через Google". */
  label: string;
}

/**
 * Server-rendered fallback link to /api/auth/google. We don't need any
 * client-side dance for the redirect flow — Google One Tap (RT-16.6) is
 * its own component layered on top of this button.
 *
 * Renders nothing if the public Google client ID isn't baked into the
 * build, so a self-hoster who hasn't set up OAuth doesn't see a dead button.
 */
export function GoogleSignInButton({ next, label }: Props) {
  // The check runs on the client because NEXT_PUBLIC_* values are inlined
  // at build time but the *server* layer of this component would render
  // identically on every request. Using state avoids a hydration mismatch.
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID));
  }, []);

  if (!enabled) return null;

  const href = next ? `/api/auth/google?next=${encodeURIComponent(next)}` : "/api/auth/google";

  return (
    <a
      href={href}
      className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[#333338] bg-[#1e1e22] text-sm font-medium text-[#e8e8ec] transition-colors hover:bg-[#26262a]"
    >
      <GoogleGlyph />
      <span>{label}</span>
    </a>
  );
}

function GoogleGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
