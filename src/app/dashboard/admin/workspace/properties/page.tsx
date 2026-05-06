"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

// RT-25.9 tick 19 — Properties overview at
// /dashboard/admin/workspace/properties. Read-only summary table of
// every property the user can access (own or manage), with the
// settings that drive availability + cleaning at a glance: minimum
// nights, check-in/out times, booking window, cleaning toggle, and
// reservation count. Edits stay in the per-property Sync settings;
// each row links there. Useful for hosts running 5+ properties to
// spot config drift across the portfolio (e.g. one property with a
// 1-night minimum, others 3).
//
// Reuses GET /api/properties — no API change. Cleaners get an empty
// array from that endpoint (filtered server-side), so the page
// renders the empty state for them.

interface Reservation {
  id: number;
}

interface Property {
  id: number;
  name: string;
  userId: number;
  minNights: number;
  checkInTime: string;
  checkOutTime: string;
  bookingWindow: number;
  cleaningEnabled: boolean;
  createdAt: string;
  reservations: Reservation[];
}

interface MeResponse {
  user?: { id: number } | null;
}

export default function AdminPropertiesPage() {
  const { locale } = useI18n();
  const [props, setProps] = useState<Property[]>([]);
  const [meId, setMeId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/properties").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/auth/me").then((r) => (r.ok ? (r.json() as Promise<MeResponse>) : null)),
    ])
      .then(([propsData, meData]) => {
        if (Array.isArray(propsData)) setProps(propsData);
        else setError(locale === "ru" ? "Не удалось загрузить" : "Failed to load");
        setMeId(meData?.user?.id ?? null);
      })
      .catch(() => setError(locale === "ru" ? "Не удалось загрузить" : "Failed to load"))
      .finally(() => setLoaded(true));
  }, [locale]);

  const sorted = useMemo(
    () => [...props].sort((a, b) => a.name.localeCompare(b.name)),
    [props]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {locale === "ru" ? "Объекты" : "Properties"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Сводка ключевых настроек по всем доступным объектам. Изменения вносятся на странице синхронизации каждого объекта."
            : "Key-settings summary across every accessible property. Edit each property's settings on its Sync tab."}
        </p>
      </div>

      {!loaded ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-4)]">
          {locale === "ru" ? "Загрузка..." : "Loading..."}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-5 text-sm text-rose-300">
          {error}
        </div>
      ) : props.length === 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-sm text-[var(--ink-3)]">
          {locale === "ru"
            ? "У вас пока нет доступных объектов."
            : "No accessible properties yet."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-2)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-3)]/40 text-[11px] uppercase tracking-wide text-[var(--ink-4)]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">
                    {locale === "ru" ? "Объект" : "Property"}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {locale === "ru" ? "Роль" : "Role"}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {locale === "ru" ? "Бронирований" : "Bookings"}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {locale === "ru" ? "Мин. ночей" : "Min nights"}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {locale === "ru" ? "Заезд / выезд" : "Check-in / out"}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {locale === "ru" ? "Окно (дн)" : "Window (d)"}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {locale === "ru" ? "Уборка" : "Cleaning"}
                  </th>
                  <th className="w-10 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]/50">
                {sorted.map((p) => {
                  const isOwner = meId !== null && p.userId === meId;
                  return (
                    <tr key={p.id} className="text-[var(--ink-2)]">
                      <td className="px-4 py-2.5 font-medium text-[var(--ink)]">{p.name}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            isOwner
                              ? "bg-sky-400/15 text-sky-300"
                              : "bg-[var(--bg-3)] text-[var(--ink-3)]"
                          }`}
                        >
                          {isOwner
                            ? locale === "ru"
                              ? "Владелец"
                              : "Owner"
                            : locale === "ru"
                            ? "Менеджер"
                            : "Manager"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{p.reservations.length}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{p.minNights}</td>
                      <td className="px-3 py-2.5 tabular-nums text-[var(--ink-3)]">
                        {p.checkInTime} / {p.checkOutTime}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{p.bookingWindow}</td>
                      <td className="px-3 py-2.5">
                        {p.cleaningEnabled ? (
                          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                            {locale === "ru" ? "Вкл" : "On"}
                          </span>
                        ) : (
                          <span className="rounded bg-[var(--bg-3)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-4)]">
                            {locale === "ru" ? "Выкл" : "Off"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Link
                          href={`/dashboard?property=${p.id}&view=sync`}
                          className="text-xs text-[var(--ink-3)] hover:text-[var(--ink)] hover:underline"
                        >
                          →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
