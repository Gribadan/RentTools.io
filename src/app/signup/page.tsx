"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { MarketingHeader } from "@/components/marketing-header";
import { AuthDivider, AuthError, AuthInput, AuthLabel, AuthSubmit } from "@/components/auth-form";

function safeNext(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="editorial min-h-screen bg-[var(--bg)]" />}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { t } = useI18n();
  // Two steps: "form" collects email + password and triggers the
  // verification email; "verify" collects the 6-digit code that
  // actually creates the account.
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  // null = still loading config, true = signup is enabled, false = disabled
  const [signupEnabled, setSignupEnabled] = useState<boolean | null>(null);
  const [supportEmail, setSupportEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { signup_enabled?: boolean; support_email?: string } | null) => {
        if (cancelled) return;
        setSignupEnabled(data?.signup_enabled !== false);
        setSupportEmail(data?.support_email ?? "");
      })
      .catch(() => {
        if (!cancelled) setSignupEnabled(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Step 1 — send the verification email.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t("signup.failed"));
        return;
      }
      setCode("");
      setStep("verify");
    } catch {
      setError(t("login.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — confirm the code; the account is created here.
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t("signup.failed"));
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError(t("login.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  // Re-trigger the signup email with the same credentials.
  const handleResend = async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t("signup.failed"));
        return;
      }
      setNotice(t("signup.resent"));
    } catch {
      setError(t("login.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editorial min-h-screen flex flex-col">
      <MarketingHeader softLocaleSwitch />

      {/* ── Main ── */}
      <main className="flex flex-1 items-center justify-center px-6 py-10 sm:py-14">
        <div className="w-full max-w-[360px]">
          <div className="mb-7 text-center">
            <h1 className="display text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--ink)] sm:text-[32px]">
              {step === "verify" ? t("signup.checkEmailTitle") : t("signup.title")}
            </h1>
            <p className="mt-2 text-[14px] text-[var(--ink-3)]">
              {step === "verify"
                ? t("signup.checkEmailSubtitle", { email })
                : t("signup.subtitle")}
            </p>
          </div>

          {signupEnabled === false ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-6 text-[14px] text-[var(--ink-2)]">
              <p className="font-medium text-[var(--ink)]">Signups are temporarily disabled</p>
              <p className="mt-2 text-[var(--ink-3)]">
                We&apos;re not accepting new accounts right now. Please check back later
                {supportEmail ? (
                  <>
                    {" "}or contact{" "}
                    <a className="text-[var(--ink)] underline" href={`mailto:${supportEmail}`}>
                      {supportEmail}
                    </a>
                    .
                  </>
                ) : (
                  "."
                )}
              </p>
            </div>
          ) : step === "verify" ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-6 sm:p-7">
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <AuthLabel htmlFor="code">{t("signup.code")}</AuthLabel>
                  <AuthInput
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder={t("signup.codePlaceholder")}
                    className="text-center text-[18px] tracking-[0.4em]"
                    autoFocus
                    required
                  />
                </div>

                {error && <AuthError message={error} />}
                {notice && (
                  <div
                    role="status"
                    className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-600 dark:text-emerald-400"
                  >
                    {notice}
                  </div>
                )}

                <AuthSubmit loading={loading} disabled={code.length !== 6}>
                  {loading ? t("signup.verifying") : t("signup.verify")}
                </AuthSubmit>
              </form>

              <div className="mt-4 flex items-center justify-between text-[13px]">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-[var(--ink-3)] underline-offset-2 hover:text-[var(--ink)] hover:underline disabled:opacity-50"
                >
                  {t("signup.resendCode")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setError("");
                    setNotice("");
                  }}
                  disabled={loading}
                  className="text-[var(--ink-3)] underline-offset-2 hover:text-[var(--ink)] hover:underline disabled:opacity-50"
                >
                  {t("signup.useDifferentEmail")}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-6 sm:p-7">
              <div className="mb-4 space-y-3">
                <GoogleSignInButton
                  next={next !== "/dashboard" ? next : undefined}
                  label={t("signup.continueWithGoogle")}
                />
                <AuthDivider label={t("login.or")} />
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="space-y-1.5">
                  <AuthLabel htmlFor="password">{t("login.password")}</AuthLabel>
                  <AuthInput
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("login.passwordPlaceholder")}
                    required
                    minLength={8}
                  />
                </div>

                {error && <AuthError message={error} />}

                <AuthSubmit loading={loading}>
                  {loading ? t("signup.creating") : t("signup.signUp")}
                </AuthSubmit>
              </form>
            </div>
          )}

          <p className="mt-5 text-center text-[13px] text-[var(--ink-3)]">
            {t("signup.haveAccount")}{" "}
            <Link
              href={next !== "/dashboard" ? `/login?next=${encodeURIComponent(next)}` : "/login"}
              // nofollow only when the link carries ?next= — those are
              // the infinite-variant URLs we don't want crawlers queuing.
              // Plain /login is indexable; let Google follow it freely.
              rel={next !== "/dashboard" ? "nofollow" : undefined}
              className="text-[var(--ink)] underline-offset-2 hover:underline"
            >
              {t("signup.signInLink")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
