"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";

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
      router.replace("/");
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : "Network error" });
    } finally {
      setAccepting(false);
    }
  };

  const isRu = locale === "ru";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111113] p-4">
      <div className="w-full max-w-[440px] rounded-xl border border-[#27272b] bg-[#18181b] p-6 space-y-4">
        {state.status === "loading" && (
          <p className="text-center text-sm text-[#a0a0a8]">{isRu ? "Загрузка приглашения…" : "Loading invite…"}</p>
        )}

        {state.status === "valid" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff385c]/10">
              <svg className="h-7 w-7 text-[#ff385c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-1.25 0-2.446-.236-3.546-.668A11.97 11.97 0 0112 21c-2.305 0-4.408-.867-6-2.292M15 19.128A9.38 9.38 0 0015.75 18c0-3.183-.86-6.165-2.36-8.737M2.25 12C2.25 6.477 6.477 2.25 12 2.25S21.75 6.477 21.75 12s-4.227 9.75-9.75 9.75S2.25 17.523 2.25 12z" />
              </svg>
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-lg font-semibold text-[#e8e8ec]">
                {isRu ? "Приглашение в управление" : "Property invitation"}
              </h1>
              <p className="text-sm text-[#a0a0a8]">
                <span className="font-medium text-[#e8e8ec]">{state.invitedBy}</span>{" "}
                {isRu ? "приглашает вас управлять объектом" : "is inviting you to manage"}{" "}
                <span className="font-medium text-[#e8e8ec]">{state.propertyName}</span>.
              </p>
              <p className="text-xs text-[#71717a]">
                {isRu ? "Вы получите доступ к календарю, бронированиям, синхронизации и уборке. Вы не сможете удалить объект или управлять другими менеджерами." : "You will get full management access — calendar, reservations, sync, cleanings. You cannot delete the property or manage other managers."}
              </p>
            </div>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="h-10 w-full rounded-lg bg-[#ff385c] text-sm font-medium text-white transition-colors hover:bg-[#e0294d] disabled:opacity-50"
            >
              {accepting ? (isRu ? "Принимаем…" : "Accepting…") : (isRu ? "Принять приглашение" : "Accept invitation")}
            </button>
            <button
              onClick={() => router.replace("/")}
              className="h-10 w-full rounded-lg border border-[#27272b] text-sm text-[#d4d4d8] hover:bg-[#1e1e22]"
            >
              {isRu ? "Отказаться" : "Decline"}
            </button>
          </>
        )}

        {state.status === "already_accepted" && (
          <>
            <p className="text-center text-sm text-[#34d399]">
              {isRu ? "Вы уже приняли это приглашение." : "You already accepted this invitation."}
            </p>
            <button
              onClick={() => router.replace("/")}
              className="h-10 w-full rounded-lg bg-[#ff385c] text-sm font-medium text-white hover:bg-[#e0294d]"
            >
              {isRu ? "Открыть приложение" : "Open app"}
            </button>
          </>
        )}

        {(state.status === "not_found" || state.status === "revoked" || state.status === "expired" || state.status === "used") && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ef4444]/10">
              <svg className="h-7 w-7 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-center text-sm text-[#e8e8ec]">
              {state.status === "not_found" && (isRu ? "Приглашение не найдено." : "Invitation not found.")}
              {state.status === "revoked" && (isRu ? "Приглашение было отменено владельцем." : "This invitation was revoked.")}
              {state.status === "expired" && (isRu ? "Срок действия приглашения истёк." : "This invitation has expired.")}
              {state.status === "used" && (isRu ? "Приглашение уже использовано другим пользователем." : "This invitation was already used by someone else.")}
            </p>
            <button
              onClick={() => router.replace("/")}
              className="h-10 w-full rounded-lg border border-[#27272b] text-sm text-[#d4d4d8] hover:bg-[#1e1e22]"
            >
              {isRu ? "Открыть приложение" : "Open app"}
            </button>
          </>
        )}

        {state.status === "error" && (
          <p className="text-center text-sm text-[#ef4444]">
            {state.message}
          </p>
        )}
      </div>
    </div>
  );
}
