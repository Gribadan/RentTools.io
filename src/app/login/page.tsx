"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";

// Only allow same-origin redirects (must start with "/" but not "//")
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111113]" />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { t, locale, setLocale } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-[#111113] p-4">
      <div className="w-full max-w-[340px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e1e22]">
            <svg className="h-5 w-5 text-[#e8e8ec]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#e8e8ec]">{t("login.title")}</h1>
          <p className="mt-1 text-sm text-[#a0a0a8]">{t("login.subtitle")}</p>
        </div>

        <div className="rounded-lg border border-[#333338] bg-[#18181b] p-6">
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
              {loading ? t("login.signingIn") : t("login.signIn")}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-[#a0a0a8]">
          {t("login.noAccount")}{" "}
          <Link href={next !== "/" ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="text-[#e8e8ec] hover:underline">
            {t("login.signUpLink")}
          </Link>
        </p>

        {/* Language selector */}
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setLocale("ru")}
            className={`rounded px-2.5 py-1 text-xs transition-colors ${locale === "ru" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a] hover:text-[#d4d4d8]"}`}
          >
            Русский
          </button>
          <button
            onClick={() => setLocale("en")}
            className={`rounded px-2.5 py-1 text-xs transition-colors ${locale === "en" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a] hover:text-[#d4d4d8]"}`}
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
}
