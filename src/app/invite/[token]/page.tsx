"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthSubmit } from "@/components/auth-form";

type InviteStatus =
  | { status: "loading" }
  | { status: "valid"; propertyId: number; propertyName: string; invitedBy: string; expiresAt: string }
  | { status: "already_accepted"; propertyId: number; propertyName: string; invitedBy: string }
  | { status: "not_found" }
  | { status: "revoked" }
  | { status: "expired" }
  | { status: "used" }
  | { status: "error"; message: string };

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { locale } = useI18n();
  const [state, setState] = useState<InviteStatus>({ status: "loading" });
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetch(`/api/property-manager-invites/accept?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (r.status === 401) {
          // not logged in — redirect to login with return path
          router.replace(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
          return null;
        }
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          setState({ status: "error", message: data.error || `HTTP ${r.status}` });
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setState(data);
      })
      .catch((e) => {
        setState({ status: "error", message: e?.message || "Network error" });
      });
  }, [token, router]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await fetch("/api/property-manager-invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({ status: "error", message: data.error || `HTTP ${res.status}` });
        return;
      }
      // Success — redirect to dashboard
      router.replace("/dashboard");
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : "Network error" });
    } finally {
      setAccepting(false);
    }
  };

  const isRu = locale === "ru";

  return (
    <div className="editorial min-h-screen flex flex-col">
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
        <div className="w-full max-w-[440px] rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-6 sm:p-7 space-y-4">
          {state.status === "loading" && (
            <p className="text-center text-[14px] text-[var(--ink-3)]">
              {isRu ? "Загрузка приглашения…" : "Loading invite…"}
            </p>
          )}

          {state.status === "valid" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--m-accent-soft)]">
                <svg className="h-7 w-7 text-[var(--m-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-1.25 0-2.446-.236-3.546-.668A11.97 11.97 0 0112 21c-2.305 0-4.408-.867-6-2.292M15 19.128A9.38 9.38 0 0015.75 18c0-3.183-.86-6.165-2.36-8.737M2.25 12C2.25 6.477 6.477 2.25 12 2.25S21.75 6.477 21.75 12s-4.227 9.75-9.75 9.75S2.25 17.523 2.25 12z" />
                </svg>
              </div>
              <div className="text-center space-y-1.5">
                <h1 className="display text-[20px] font-semibold tracking-tight text-[var(--ink)]">
                  {isRu ? "Приглашение в управление" : "Property invitation"}
                </h1>
                <p className="text-[14px] text-[var(--ink-2)]">
                  <span className="font-medium text-[var(--ink)]">{state.invitedBy}</span>{" "}
                  {isRu ? "приглашает вас управлять объектом" : "is inviting you to manage"}{" "}
                  <span className="font-medium text-[var(--ink)]">{state.propertyName}</span>.
                </p>
                <p className="text-[12px] text-[var(--ink-3)]">
                  {isRu ? "Вы получите доступ к календарю, бронированиям, синхронизации и уборке. Вы не сможете удалить объект или управлять другими менеджерами." : "You will get full management access — calendar, reservations, sync, cleanings. You cannot delete the property or manage other managers."}
                </p>
              </div>
              <AuthSubmit type="button" loading={accepting} onClick={handleAccept}>
                {accepting ? (isRu ? "Принимаем…" : "Accepting…") : (isRu ? "Принять приглашение" : "Accept invitation")}
              </AuthSubmit>
              <button
                type="button"
                onClick={() => router.replace("/dashboard")}
                className="h-11 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] text-[14px] text-[var(--ink-2)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)]"
              >
                {isRu ? "Отказаться" : "Decline"}
              </button>
            </>
          )}

          {state.status === "already_accepted" && (
            <>
              <p className="text-center text-[14px] text-[var(--ink-2)]">
                {isRu ? "Вы уже приняли это приглашение." : "You already accepted this invitation."}
              </p>
              <AuthSubmit type="button" onClick={() => router.replace("/dashboard")}>
                {isRu ? "Открыть приложение" : "Open app"}
              </AuthSubmit>
            </>
          )}

          {(state.status === "not_found" || state.status === "revoked" || state.status === "expired" || state.status === "used") && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--m-accent-soft)]">
                <svg className="h-7 w-7 text-[var(--m-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-center text-[14px] text-[var(--ink)]">
                {state.status === "not_found" && (isRu ? "Приглашение не найдено." : "Invitation not found.")}
                {state.status === "revoked" && (isRu ? "Приглашение было отменено владельцем." : "This invitation was revoked.")}
                {state.status === "expired" && (isRu ? "Срок действия приглашения истёк." : "This invitation has expired.")}
                {state.status === "used" && (isRu ? "Приглашение уже использовано другим пользователем." : "This invitation was already used by someone else.")}
              </p>
              <button
                type="button"
                onClick={() => router.replace("/dashboard")}
                className="h-11 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg)] text-[14px] text-[var(--ink-2)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)]"
              >
                {isRu ? "Открыть приложение" : "Open app"}
              </button>
            </>
          )}

          {state.status === "error" && (
            <p className="text-center text-[14px] text-[var(--m-accent)]">{state.message}</p>
          )}
        </div>
      </main>
    </div>
  );
}
