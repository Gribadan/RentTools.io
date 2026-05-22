"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { MarketingHeader } from "@/components/marketing-header";
import { AuthError, AuthInput, AuthLabel, AuthSubmit } from "@/components/auth-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="editorial min-h-screen bg-[var(--bg)]" />}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const { t } = useI18n();
  // request → enter email; verify → enter code + new password;
  // done → password updated, prompt to sign in.
  const [step, setStep] = useState<"request" | "verify" | "done">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1 — request a reset code. The endpoint always returns ok
  // (no account enumeration), so we always advance to the verify step.
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setCode("");
      setStep("verify");
    } catch {
      setError(t("login.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — confirm the code and set the new password.
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t("reset.failed"));
        return;
      }
      setStep("done");
    } catch {
      setError(t("login.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  const heading =
    step === "done"
      ? t("reset.doneTitle")
      : step === "verify"
        ? t("reset.sentTitle")
        : t("reset.title");
  const sub =
    step === "done"
      ? t("reset.doneSubtitle")
      : step === "verify"
        ? t("reset.sentSubtitle")
        : t("reset.subtitle");

  return (
    <div className="editorial min-h-screen flex flex-col">
      <MarketingHeader />

      <main className="flex flex-1 items-center justify-center px-6 py-10 sm:py-14">
        <div className="w-full max-w-[360px]">
          <div className="mb-7 text-center">
            <h1 className="display text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--ink)] sm:text-[32px]">
              {heading}
            </h1>
            <p className="mt-2 text-[14px] text-[var(--ink-3)]">{sub}</p>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-6 sm:p-7">
            {step === "request" && (
              <form onSubmit={handleRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <AuthLabel htmlFor="email">{t("login.email")}</AuthLabel>
                  <AuthInput
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("login.emailPlaceholder")}
                    autoFocus
                    required
                  />
                </div>
                {error && <AuthError message={error} />}
                <AuthSubmit loading={loading}>
                  {loading ? t("reset.sending") : t("reset.send")}
                </AuthSubmit>
              </form>
            )}

            {step === "verify" && (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <AuthLabel htmlFor="code">{t("reset.code")}</AuthLabel>
                  <AuthInput
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder={t("reset.codePlaceholder")}
                    className="text-center text-[18px] tracking-[0.4em]"
                    autoFocus
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <AuthLabel htmlFor="newPassword">{t("reset.newPassword")}</AuthLabel>
                  <AuthInput
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("reset.newPasswordPlaceholder")}
                    required
                    minLength={8}
                  />
                </div>
                {error && <AuthError message={error} />}
                <AuthSubmit loading={loading} disabled={code.length !== 6}>
                  {loading ? t("reset.submitting") : t("reset.submit")}
                </AuthSubmit>
              </form>
            )}

            {step === "done" && (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                  <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <Link
                  href="/login"
                  className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--m-accent)] text-[14px] font-medium text-white transition-colors hover:bg-[var(--m-accent-2)]"
                >
                  {t("login.signIn")}
                </Link>
              </div>
            )}
          </div>

          <p className="mt-5 text-center text-[13px] text-[var(--ink-3)]">
            <Link
              href="/login"
              className="text-[var(--ink)] underline-offset-2 hover:underline"
            >
              {t("reset.backToLogin")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
