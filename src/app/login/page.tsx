"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";

export default function LoginPage() {
  const router = useRouter();
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

      router.push("/");
      router.refresh();
    } catch {
      setError(t("login.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0f14] p-4">
      <div className="w-full max-w-[340px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a1f2b]">
            <svg className="h-5 w-5 text-[#6c8fff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#e8ecf2]">{t("login.title")}</h1>
          <p className="mt-1 text-sm text-[#8b92a0]">{t("login.subtitle")}</p>
        </div>

        <div className="rounded-lg border border-[#2a3142] bg-[#13171e] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm text-[#d4d8e0]" htmlFor="username">{t("login.username")}</label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("login.usernamePlaceholder")}
                className="h-9 w-full rounded-md border border-[#2a3142] bg-[#0c0f14] px-3 text-sm text-[#e8ecf2] placeholder-[#6b7280] outline-none focus:border-[#6c8fff] focus:ring-1 focus:ring-[#6c8fff]"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-[#d4d8e0]" htmlFor="password">{t("login.password")}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                className="h-9 w-full rounded-md border border-[#2a3142] bg-[#0c0f14] px-3 text-sm text-[#e8ecf2] placeholder-[#6b7280] outline-none focus:border-[#6c8fff] focus:ring-1 focus:ring-[#6c8fff]"
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
              className="h-9 w-full rounded-md bg-[#059669] text-sm font-medium text-white transition-colors hover:bg-[#047857] disabled:opacity-50"
              disabled={loading}
            >
              {loading ? t("login.signingIn") : t("login.signIn")}
            </button>
          </form>
        </div>

        {/* Language selector */}
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setLocale("ru")}
            className={`rounded px-2.5 py-1 text-xs transition-colors ${locale === "ru" ? "bg-[#1a1f2b] text-[#e8ecf2]" : "text-[#6b7280] hover:text-[#d4d8e0]"}`}
          >
            Русский
          </button>
          <button
            onClick={() => setLocale("en")}
            className={`rounded px-2.5 py-1 text-xs transition-colors ${locale === "en" ? "bg-[#1a1f2b] text-[#e8ecf2]" : "text-[#6b7280] hover:text-[#d4d8e0]"}`}
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
}
