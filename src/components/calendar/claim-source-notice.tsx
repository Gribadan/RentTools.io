import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import type { Reservation } from "@/lib/types";
import { findClaimSourceMismatches } from "./claim-source-mismatches";
import type { CalendarEvent } from "./types";

interface CopyShape {
  title: string;
  explanation: string;
  reservation: string;
  source: string;
  noOverlap: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "Reservation dates differ from the source calendar",
    explanation: "Both date ranges stay blocked in the calendar. Check the source calendar: editing a reservation does not change its iCal dates. Dates below are check-in → check-out.",
    reservation: "Reservation",
    source: "Source calendar",
    noOverlap: "The linked source no longer overlaps this reservation. Review its link and dates.",
  },
  ru: {
    title: "Даты бронирования отличаются от исходного календаря",
    explanation: "Оба диапазона остаются занятыми в календаре. Проверьте исходный календарь: редактирование бронирования не меняет его даты iCal. Ниже указаны заезд → выезд.",
    reservation: "Бронирование",
    source: "Исходный календарь",
    noOverlap: "Связанное событие больше не пересекается с бронированием. Проверьте связь и даты.",
  },
  de: {
    title: "Buchungsdaten weichen vom Quellkalender ab",
    explanation: "Beide Zeiträume bleiben im Kalender gesperrt. Prüfen Sie den Quellkalender: Eine Buchungsänderung ändert dessen iCal-Daten nicht. Die Daten zeigen Anreise → Abreise.",
    reservation: "Buchung",
    source: "Quellkalender",
    noOverlap: "Das verknüpfte Quellereignis überschneidet sich nicht mehr mit dieser Buchung. Prüfen Sie die Verknüpfung und die Daten.",
  },
  fr: {
    title: "Les dates de réservation diffèrent du calendrier source",
    explanation: "Les deux périodes restent bloquées dans le calendrier. Vérifiez le calendrier source : modifier une réservation ne change pas ses dates iCal. Les dates indiquent arrivée → départ.",
    reservation: "Réservation",
    source: "Calendrier source",
    noOverlap: "L’événement source lié ne chevauche plus cette réservation. Vérifiez le lien et les dates.",
  },
  es: {
    title: "Las fechas de la reserva difieren del calendario de origen",
    explanation: "Ambos intervalos siguen bloqueados en el calendario. Revise el calendario de origen: editar una reserva no cambia sus fechas iCal. Las fechas indican llegada → salida.",
    reservation: "Reserva",
    source: "Calendario de origen",
    noOverlap: "El evento de origen vinculado ya no coincide con esta reserva. Revise el vínculo y las fechas.",
  },
};

interface ClaimSourceNoticeProps {
  reservations: readonly Reservation[];
  events: readonly CalendarEvent[];
  loading: boolean;
}

export function ClaimSourceNotice({ reservations, events, loading }: ClaimSourceNoticeProps) {
  const { locale } = useI18n();
  const mismatches = loading ? [] : findClaimSourceMismatches(reservations, events);
  if (mismatches.length === 0) return null;
  const c = COPY[locale];

  return (
    <div role="status" className="mb-2 space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-[var(--ink)]">
      <p className="font-semibold">{c.title}</p>
      <p className="text-[var(--ink-2)]">{c.explanation}</p>
      <ul tabIndex={0} aria-label={c.title} className="max-h-32 space-y-2 overflow-y-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500">
        {mismatches.map((mismatch) => (
          <li key={mismatch.reservationId} className="space-y-0.5">
            <p className="break-words font-medium">{mismatch.reservationName}</p>
            <p>{c.reservation}: <time dateTime={mismatch.localCheckIn}>{mismatch.localCheckIn}</time> → <time dateTime={mismatch.localCheckOut}>{mismatch.localCheckOut}</time></p>
            <p>{c.source} ({mismatch.platform === "booking" ? "Booking.com" : mismatch.platform === "airbnb" ? "Airbnb" : mismatch.platform}): <time dateTime={mismatch.sourceCheckIn}>{mismatch.sourceCheckIn}</time> → <time dateTime={mismatch.sourceCheckOut}>{mismatch.sourceCheckOut}</time></p>
            {!mismatch.overlapsSource && <p className="font-medium">{c.noOverlap}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
