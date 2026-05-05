"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { LocaleSwitcher } from "@/components/locale-switcher";

function safeNext(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111113]" />}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111113] p-4">
      <div className="w-full max-w-[340px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e1e22]">
            <svg className="h-5 w-5 text-[#e8e8ec]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#e8e8ec]">{t("signup.title")}</h1>
          <p className="mt-1 text-sm text-[#a0a0a8]">{t("signup.subtitle")}</p>
        </div>

        {signupEnabled === false ? (
          <div className="rounded-lg border border-[#333338] bg-[#18181b] p-6 text-sm text-[#d4d4d8]">
            <p className="font-medium text-[#e8e8ec]">Signups are temporarily disabled</p>
            <p className="mt-2 text-[#a0a0a8]">
              We&apos;re not accepting new accounts right now. Please check back later
              {supportEmail ? (
                <>
                  {" "}or contact{" "}
                  <a className="text-[#e8e8ec] underline" href={`mailto:${supportEmail}`}>
                    {supportEmail}
                  </a>
                  .
                </>
              ) : (
                "."
              )}
            </p>
          </div>
        ) : (
        <div className="rounded-lg border border-[#333338] bg-[#18181b] p-6">
          <div className="mb-4 space-y-3">
            <GoogleSignInButton next={next !== "/dashboard" ? next : undefined} label={t("signup.continueWithGoogle")} />
            <div className="flex items-center gap-3 text-xs text-[#71717a]">
              <span className="h-px flex-1 bg-[#333338]" />
              <span>{t("login.or")}</span>
              <span className="h-px flex-1 bg-[#333338]" />
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm text-[#d4d4d8]" htmlFor="username">{t("login.username")}</label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("login.usernamePlaceholder")}
                className="h-9 w-full rounded-md border border-[#333338] bg-[#111113] px-3 text-sm text-[#e8e8ec] placeholder-[#71717a] outline-none focus:border-[#e8e8ec] focus:ring-1 focus:ring-[#e8e8ec]"
                autoFocus
                required
                minLength={3}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-[#d4d4d8]" htmlFor="password">{t("login.password")}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                className="h-9 w-full rounded-md border border-[#333338] bg-[#111113] px-3 text-sm text-[#e8e8ec] placeholder-[#71717a] outline-none focus:border-[#e8e8ec] focus:ring-1 focus:ring-[#e8e8ec]"
                required
                minLength={12}
              />
            </div>

            {error && (
              <div className="rounded-md bg-[#ef4444]/10 border border-[#ef4444]/20 px-3 py-2 text-sm text-[#ef4444]">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="h-9 w-full rounded-md bg-[#ff385c] text-sm font-medium text-white transition-colors hover:bg-[#e0294d] disabled:opacity-50"
              disabled={loading}
            >
              {loading ? t("signup.creating") : t("signup.signUp")}
            </button>
          </form>
        </div>
        )}

        <p className="mt-4 text-center text-xs text-[#a0a0a8]">
          {t("signup.haveAccount")}{" "}
          <Link href={next !== "/dashboard" ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-[#e8e8ec] hover:underline">
            {t("signup.signInLink")}
          </Link>
        </p>

        <div className="mt-4 flex justify-center">
          <LocaleSwitcher variant="inline" reloadOnChange={false} />
        </div>
      </div>
    </div>
  );
}
