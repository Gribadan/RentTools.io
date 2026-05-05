"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { GoogleOneTap } from "@/components/google-one-tap";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthDivider, AuthError, AuthInput, AuthLabel, AuthSubmit } from "@/components/auth-form";

// Only allow same-origin redirects (must start with "/" but not "//")
function safeNext(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="editorial min-h-screen bg-[var(--bg)]" />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Surface ?error=... from a failed Google callback redirect.
  useEffect(() => {
    const errParam = searchParams.get("error");
    if (!errParam) return;
    if (errParam === "access_denied") return; // user cancelled, not a failure
    if (errParam === "account_suspended") {
      setError(t("login.failed"));
      return;
    }
    setError(t("login.googleError"));
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("login.failed"));
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

  return (
    <div className="editorial min-h-screen flex flex-col">
      <GoogleOneTap next={next !== "/dashboard" ? next : undefined} />

      {/* ── Header ── */}
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-[920px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--ink)] text-[var(--bg)] transition-transform group-hover:rotate-6">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12l9-9 9 9" />
                <path d="M5 10v10a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V10" />
              </svg>
            </div>
            <span className="display text-[17px] font-semibold tracking-tight text-[var(--ink)]">RentTools</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex flex-1 items-center justify-center px-6 py-10 sm:py-14">
        <div className="w-full max-w-[360px]">
          <div className="mb-7 text-center">
            <h1 className="display text-[28px] font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--ink)] sm:text-[32px]">
              {t("login.title")}
            </h1>
            <p className="mt-2 text-[14px] text-[var(--ink-3)]">{t("login.subtitle")}</p>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-6 sm:p-7">
            <div className="mb-4 space-y-3">
              <GoogleSignInButton
                next={next !== "/dashboard" ? next : undefined}
                label={t("login.continueWithGoogle")}
              />
              <AuthDivider label={t("login.or")} />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <AuthLabel htmlFor="username">{t("login.username")}</AuthLabel>
                <AuthInput
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("login.usernamePlaceholder")}
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <AuthLabel htmlFor="password">{t("login.password")}</AuthLabel>
                <AuthInput
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
                  required
                />
              </div>

              {error && <AuthError message={error} />}

              <AuthSubmit loading={loading}>
                {loading ? t("login.signingIn") : t("login.signIn")}
              </AuthSubmit>
            </form>
          </div>

          <p className="mt-5 text-center text-[13px] text-[var(--ink-3)]">
            {t("login.noAccount")}{" "}
            <Link
              href={next !== "/dashboard" ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
              className="text-[var(--ink)] underline-offset-2 hover:underline"
            >
              {t("login.signUpLink")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
