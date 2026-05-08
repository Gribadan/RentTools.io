"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const BODY_MAX = 2000;
const EMAIL_MAX = 200;

// Routes where the floating Feedback button should NOT render. Each entry
// is a prefix match (`startsWith`). Hidden on:
//   - /g/, /invite/ — guest-form / invite-token surfaces; one-shot tasks
//     where a feedback CTA would be noise.
//   - /admin — superadmin shouldn't be sending feedback to themselves.
// Dashboard intentionally INCLUDED — signed-in hosts are the people whose
// feedback we most want to capture (they hit real product friction).
const HIDE_ON_PREFIXES = ["/g/", "/invite/", "/dashboard/admin", "/admin/"];

type SubmitState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success" }
  | { kind: "error"; message: string };

/**
 * Floating "Send feedback" pill in the bottom-right corner of every
 * public page. Click → modal with a textarea + optional email field +
 * a hidden honeypot. Submit → POST /api/feedback. Server enforces a
 * 30-second per-IP rate limit; the client surfaces the resulting 429
 * to the user with the retry-after seconds.
 *
 * A11y notes:
 *   - <dialog> via role="dialog" + aria-modal so screen readers announce it.
 *   - Focus moves to the textarea on open; ESC + the X button close it.
 *   - The trigger restores focus to itself on close.
 *   - Honeypot is aria-hidden + autocomplete="off" so assistive tech
 *     skips it (only bots find it via DOM scraping).
 */
export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Hide on protected/distracting routes.
  const hidden = pathname ? HIDE_ON_PREFIXES.some((p) => pathname.startsWith(p)) : false;

  // Focus management when the modal opens / closes.
  useEffect(() => {
    if (!open) return;
    textareaRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) triggerRef.current?.focus();
  }, [open]);

  // Reset transient state when the modal closes.
  useEffect(() => {
    if (open) return;
    if (state.kind === "success") {
      // Auto-reset a moment after close so the next open is fresh.
      const t = setTimeout(() => {
        setBody("");
        setEmail("");
        setHoneypot("");
        setState({ kind: "idle" });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open, state.kind]);

  if (hidden) return null;

  const submit = async () => {
    if (state.kind === "sending") return;
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          contactEmail: email.trim() || undefined,
          pagePath: pathname ?? "",
          website: honeypot, // honeypot — server silently 200s if non-empty
        }),
      });
      if (res.ok) {
        setState({ kind: "success" });
        // Auto-close on success after a short beat so the user sees the
        // confirmation.
        setTimeout(() => setOpen(false), 1400);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setState({
        kind: "error",
        message: data.error ?? `Couldn't send (${res.status}). Try again in a moment.`,
      });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  };

  const counter = `${body.length} / ${BODY_MAX}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        // Position uses CSS env() for the iOS Safari home-indicator
        // safe-area inset; without it, the pill sits behind the
        // dynamic bottom toolbar on iPhone and is half-tappable.
        // Also: px-3 + smaller text on mobile so the floating pill
        // doesn't crowd the bottom-right of a 375px viewport when the
        // user is scrolling content.
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)", right: "calc(env(safe-area-inset-right, 0px) + 16px)" }}
        className="fixed z-40 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--bg)]/95 px-3 py-2 text-[12px] font-medium text-[var(--ink-2)] shadow-[0_6px_24px_-6px_rgba(0,0,0,0.18),0_2px_8px_-4px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-[var(--bg-2)] hover:text-[var(--ink)] hover:shadow-[0_10px_32px_-8px_rgba(0,0,0,0.22),0_4px_12px_-4px_rgba(0,0,0,0.14)] sm:px-4 sm:py-2.5 sm:text-[13px]"
      >
        <svg
          aria-hidden
          className="h-3.5 w-3.5 text-[var(--m-accent)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Feedback
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-heading"
          // Modal: items-end on mobile so it slides up from the bottom
          // of the viewport (sheet behaviour, native to iOS / Android),
          // items-center on sm+ where there's room to center it.
          // p-3 on mobile so the modal can be wider, p-4 elsewhere.
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="feedback-heading"
                  className="text-base font-semibold text-[var(--ink)]"
                >
                  Send feedback
                </h2>
                <p className="mt-0.5 text-[12px] text-[var(--ink-3)]">
                  What&rsquo;s on your mind? Bug, missing feature, or kind word.
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-m-1.5 inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--ink)]"
              >
                <svg
                  aria-hidden
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {state.kind === "success" ? (
              <div
                role="status"
                className="rounded-xl border border-[var(--m-accent)]/30 bg-[color-mix(in_oklab,var(--m-accent)_8%,var(--bg-2))] p-5 text-center"
              >
                <div className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--m-accent)] text-white">
                  <svg
                    aria-hidden
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[var(--ink)]">Thanks — got it.</p>
                <p className="mt-1 text-[12px] text-[var(--ink-3)]">
                  The maintainer reads every message.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
                className="space-y-3"
              >
                <div>
                  <label
                    htmlFor="feedback-body"
                    className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[var(--ink-4)]"
                  >
                    Message
                  </label>
                  <textarea
                    ref={textareaRef}
                    id="feedback-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
                    rows={5}
                    required
                    minLength={5}
                    maxLength={BODY_MAX}
                    placeholder="What's working, what's not, what's missing…"
                    className="w-full resize-y rounded-lg border border-[var(--line)] bg-[var(--bg-2)]/50 p-3 text-sm leading-relaxed text-[var(--ink)] outline-none transition-colors focus-visible:border-[var(--m-accent)] focus-visible:bg-[var(--bg)]"
                  />
                  <p className="mt-1 text-right text-[10px] text-[var(--ink-4)]">{counter}</p>
                </div>

                <div>
                  <label
                    htmlFor="feedback-email"
                    className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[var(--ink-4)]"
                  >
                    Email (optional)
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.slice(0, EMAIL_MAX))}
                    maxLength={EMAIL_MAX}
                    placeholder="If you want a reply"
                    autoComplete="email"
                    className="h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--bg-2)]/50 px-3 text-sm text-[var(--ink)] outline-none transition-colors focus-visible:border-[var(--m-accent)] focus-visible:bg-[var(--bg)]"
                  />
                </div>

                {/* Honeypot — hidden from humans + assistive tech, visible
                    to dumb form-filling bots. Stays in the form so it
                    catches the request before it reaches the rate limit. */}
                <div aria-hidden className="hidden">
                  <label htmlFor="feedback-website">Website (leave blank)</label>
                  <input
                    id="feedback-website"
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {state.kind === "error" && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300"
                  >
                    {state.message}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-1.5 text-sm text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--ink)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={state.kind === "sending" || body.trim().length < 5}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[var(--m-accent)] px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-[var(--m-accent-2)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {state.kind === "sending" ? "Sending…" : "Send"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
