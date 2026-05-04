"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

interface Props {
  /** Optional same-origin path to land on after sign-in. */
  next?: string;
  /**
   * Suppress the One Tap UI when an alternate Google flow is also visible
   * on the page — avoids showing the prompt twice in the same viewport.
   */
  disabled?: boolean;
}

interface CredentialResponse {
  credential: string;
  select_by?: string;
}

interface PromptNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
  getDismissedReason: () => string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: "signin" | "signup" | "use";
    use_fedcm_for_prompt?: boolean;
    itp_support?: boolean;
  }) => void;
  prompt: (notification?: (n: PromptNotification) => void) => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
    handleGoogleOneTapCredential?: (response: CredentialResponse) => void;
  }
}

/**
 * Google One Tap prompt (RT-16.6). Renders nothing when:
 *   - the public client ID isn't baked into the build
 *   - the parent passes `disabled` (e.g. an alternate Google flow is showing)
 *   - the user has dismissed the prompt this browser session
 *
 * Uses the FedCM-compatible API (Chrome 117+ requires `use_fedcm_for_prompt`
 * since 2024 to keep One Tap working without third-party cookies).
 */
export function GoogleOneTap({ next, disabled }: Props) {
  const router = useRouter();
  const initializedRef = useRef(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || disabled) return;

    // Defined as a window function so the GIS script can call it back even
    // if React reconciles us. Using a ref-stable closure that reads `next`
    // off a closure variable is fine because `next` only changes between
    // page navigations (which remount this component anyway).
    window.handleGoogleOneTapCredential = async (response: CredentialResponse) => {
      try {
        const res = await fetch("/api/auth/google/one-tap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential, next }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { ok?: boolean; redirect?: string };
        if (data.ok && data.redirect) {
          router.push(data.redirect);
          router.refresh();
        }
      } catch {
        // Network blip — the user can fall back to the form below.
      }
    };

    return () => {
      try {
        window.google?.accounts.id.cancel();
      } catch {
        // GIS not loaded yet — nothing to cancel.
      }
      window.handleGoogleOneTapCredential = undefined;
    };
  }, [clientId, disabled, next, router]);

  if (!clientId || disabled) return null;

  // The `onLoad` handler initialises GIS once the script has resolved. We
  // also re-attempt on every render via the ref guard so a cached script
  // (e.g. on client navigation back to the page) still triggers the prompt.
  const onScriptReady = () => {
    if (initializedRef.current) return;
    if (!window.google?.accounts?.id) return;
    initializedRef.current = true;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => window.handleGoogleOneTapCredential?.(response),
      auto_select: false,
      cancel_on_tap_outside: true,
      context: "signin",
      use_fedcm_for_prompt: true,
      itp_support: true,
    });
    window.google.accounts.id.prompt();
  };

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={onScriptReady}
      onReady={onScriptReady}
    />
  );
}
