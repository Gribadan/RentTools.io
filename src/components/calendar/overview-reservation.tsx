"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { ReservationView } from "@/components/reservation-view";
import { useI18n } from "@/lib/i18n/context";
import type { Guest, Reservation } from "@/lib/types";
import { OVERVIEW_COPY } from "./overview-copy";

interface OverviewReservationProps {
  reservationId: number;
  propertyName?: string;
  onClose: () => void;
  onChanged: () => void;
}

type ReservationActions = ComponentProps<typeof ReservationView>;
type CardData = { id: number; reservation: Reservation; guests: Guest[] };

async function responseError(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  return body && typeof body === "object" && "error" in body && typeof body.error === "string"
    ? body.error
    : `Request failed (${response.status})`;
}

export function OverviewReservation({ reservationId, propertyName, onClose, onChanged }: OverviewReservationProps) {
  const { locale } = useI18n();
  const c = OVERVIEW_COPY[locale];
  const [data, setData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const requestVersion = useRef(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const [reservationResponse, guestsResponse] = await Promise.all([
        fetch(`/api/reservations/${reservationId}`, { signal, cache: "no-store" }),
        fetch(`/api/guests?reservationId=${reservationId}`, { signal, cache: "no-store" }),
      ]);
      if (!reservationResponse.ok) throw new Error(await responseError(reservationResponse));
      if (!guestsResponse.ok) throw new Error(await responseError(guestsResponse));
      const reservation: Reservation = await reservationResponse.json();
      const guests: Guest[] = await guestsResponse.json();
      if (reservation.id !== reservationId || !Array.isArray(guests)) throw new Error("Invalid reservation response");
      if (version === requestVersion.current && !signal?.aborted) {
        setData({ id: reservationId, reservation, guests });
      }
    } catch (err) {
      if (version === requestVersion.current && !signal?.aborted) {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    } finally {
      if (version === requestVersion.current && !signal?.aborted) setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) return load(controller.signal);
    });
    return () => controller.abort();
  }, [load]);

  const mutate = async (url: string, method: "PATCH" | "DELETE", fields?: unknown) => {
    setActionError(null);
    try {
      const response = await fetch(url, {
        method,
        ...(fields !== undefined ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        } : {}),
      });
      if (!response.ok) throw new Error(await responseError(response));
      return { ok: true as const };
    } catch {
      const message = c.requestFailed;
      setActionError(message);
      return { ok: false as const, error: message };
    }
  };

  const refresh = () => {
    void load();
    onChanged();
  };

  const updateReservation: ReservationActions["onUpdateReservation"] = async (id, fields) => {
    const result = await mutate(`/api/reservations/${id}`, "PATCH", fields);
    if (result.ok) refresh();
    return result;
  };

  const deleteReservation: ReservationActions["onDeleteReservation"] = async (id) => {
    const result = await mutate(`/api/reservations/${id}`, "DELETE");
    if (result.ok) {
      onChanged();
      onClose();
    }
    return result;
  };

  const updateGuest: ReservationActions["onUpdateGuest"] = async (id, fields) => {
    const result = await mutate(`/api/guests/${id}`, "PATCH", fields);
    if (!result.ok) throw new Error(result.error);
    refresh();
  };

  const deleteGuest: ReservationActions["onDeleteGuest"] = async (id) => {
    if ((await mutate(`/api/guests/${id}`, "DELETE")).ok) refresh();
  };

  const updateParent: ReservationActions["onUpdateParent"] = async (id, parentId) => {
    if ((await mutate(`/api/guests/${id}`, "PATCH", { parentId })).ok) refresh();
  };

  return (
    <section aria-label={c.reservationDetails}>
      <button type="button" onClick={onClose}
        className="mb-4 min-h-11 rounded-lg border border-[var(--line-2)] px-4 text-sm text-[var(--ink)] hover:bg-[var(--bg-3)] focus-visible:outline-2 focus-visible:outline-[var(--m-accent)]">
        ← {c.backToOverview}
      </button>
      {actionError && <p role="alert" className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">{actionError}</p>}
      {loading || (!error && data?.id !== reservationId) ? (
        <p role="status" className="py-10 text-center text-[var(--ink-3)]">{c.loadingReservation}</p>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-5">
          <p>{c.reservationUnavailable}</p>
          <button type="button" onClick={() => void load()} className="mt-3 min-h-11 rounded-lg border border-[var(--line-2)] px-4 focus-visible:outline-2 focus-visible:outline-[var(--m-accent)]">
            {c.retry}
          </button>
        </div>
      ) : data && (
        <ReservationView key={reservationId} reservation={data.reservation} guests={data.guests}
          propertyName={propertyName} onGuestsUpdated={refresh} onDeleteGuest={deleteGuest}
          onDeleteReservation={deleteReservation} onUpdateReservation={updateReservation}
          onUpdateParent={updateParent} onUpdateGuest={updateGuest} />
      )}
    </section>
  );
}
