"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

interface CopyShape {
  dateLocale: string;
  staysTurnover: (count: number) => string;
  manualCleaning: string;
  blockDate: string;
  blockDateDesc: string;
  scheduleCleaning: string;
  scheduleCleaningDesc: string;
  makeAvailable: string;
  makeAvailableDesc: string;
  unblockDate: string;
  removeCleaning: string;
  resetOverride: string;
  resetOverrideDesc: string;
  createReservation: string;
  createReservationDesc: string;
  cancelCleaningOnBooked: string;
  cancelCleaningOnBookedDesc: string;
  removeCleaningDescAuto: string;
  cancelCleaningOnAuto: string;
  cancelCleaningOnAutoDesc: string;
  blockAll: (count: number) => string;
  scheduleAll: (count: number) => string;
  openAll: (count: number) => string;
  resetAll: (count: number) => string;
  createBulk: (count: number) => string;
  createBulkDesc: string;
  noActions: string;
  selectedDates: string;
  daysCount: (count: number) => string;
  bookedDisabled: (count: number) => string;
  contiguousRange: string;
  nonContiguous: string;
  close: string;
  checkingOut: string;
  checkingIn: string;
  singleDayStay: string;
  staying: string;
  cleanLabel: string;
  cleaningScheduled: string;
  cleaningRequired: string;
  betweenStays: string;
  removeFromSelection: string;
  guestName: string;
  guestNamePlaceholder: string;
  platform: string;
  platformDirect: string;
  checkInLabel: string;
  checkOutLabel: string;
  nightsParenthetical: (count: number) => string;
  linkToBooking: string;
  beforeCheckIn: string;
  afterCheckOut: string;
  stayLabel: string;
  addNights: (nights: number, side: string) => string;
  cancel: string;
  saving: string;
  save: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    dateLocale: "en-GB",
    staysTurnover: (count) => `${count} stays — turnover`,
    manualCleaning: "Manual cleaning",
    blockDate: "Block this date",
    blockDateDesc: "Stop new bookings. No cleaning chip.",
    scheduleCleaning: "Schedule cleaning",
    scheduleCleaningDesc: "Block the date and mark it as a cleaning slot.",
    makeAvailable: "Make available for booking",
    makeAvailableDesc: "Ignore buffer / min-nights for this date.",
    unblockDate: "Unblock this date",
    removeCleaning: "Remove cleaning",
    resetOverride: "Reset to default",
    resetOverrideDesc: "Return this date to its auto-detected state.",
    createReservation: "Create reservation",
    createReservationDesc: "Add a reservation starting on this date.",
    cancelCleaningOnBooked: "Cancel cleaning",
    cancelCleaningOnBookedDesc: "Free this date from the cleaning — schedule it on another day.",
    removeCleaningDescAuto: "Go back to the auto-detected hint.",
    cancelCleaningOnAuto: "Cancel cleaning",
    cancelCleaningOnAutoDesc: "Free up this date — schedule cleaning on another day instead.",
    blockAll: (count) => `Block all (${count})`,
    scheduleAll: (count) => `Schedule cleaning (${count})`,
    openAll: (count) => `Make available (${count})`,
    resetAll: (count) => `Reset overrides (${count})`,
    createBulk: (count) => `Create reservation (${count} ${count === 1 ? "night" : "nights"})`,
    createBulkDesc: "One reservation covering all selected days.",
    noActions: "No actions available.",
    selectedDates: "Selected dates",
    daysCount: (count) => (count === 1 ? "day" : "days"),
    bookedDisabled: (count) => `${count} booked — bulk actions disabled`,
    contiguousRange: "Contiguous range",
    nonContiguous: "Non-contiguous",
    close: "Close",
    checkingOut: "checking out",
    checkingIn: "checking in",
    singleDayStay: "single-day stay",
    staying: "staying",
    cleanLabel: "Clean",
    cleaningScheduled: "Cleaning scheduled",
    cleaningRequired: "Cleaning required",
    betweenStays: "between stays",
    removeFromSelection: "Remove from selection",
    guestName: "Guest name",
    guestNamePlaceholder: "Jane Doe",
    platform: "Platform",
    platformDirect: "Direct",
    checkInLabel: "Check-in:",
    checkOutLabel: "Check-out:",
    nightsParenthetical: (count) => `(${count} ${count === 1 ? "night" : "nights"})`,
    linkToBooking: "Link to an existing booking",
    beforeCheckIn: "before check-in",
    afterCheckOut: "after check-out",
    stayLabel: "Stay",
    addNights: (nights, side) =>
      `Add ${nights} ${nights === 1 ? "night" : "nights"} ${side}`,
    cancel: "Cancel",
    saving: "Saving…",
    save: "Save",
  },
  ru: {
    dateLocale: "ru-RU",
    staysTurnover: (count) => `${count} брони — пересменка`,
    manualCleaning: "Ручная уборка",
    blockDate: "Заблокировать дату",
    blockDateDesc: "Запретить новые брони. Без отметки уборки.",
    scheduleCleaning: "Запланировать уборку",
    scheduleCleaningDesc: "Заблокировать дату и пометить как уборку.",
    makeAvailable: "Сделать доступной",
    makeAvailableDesc: "Игнорировать буфер уборки / минимум ночей.",
    unblockDate: "Разблокировать",
    removeCleaning: "Снять уборку",
    resetOverride: "Сбросить ручное состояние",
    resetOverrideDesc: "Вернуть автоматическое поведение для этой даты.",
    createReservation: "Создать бронь",
    createReservationDesc: "Добавить бронь, начинающуюся в этот день.",
    cancelCleaningOnBooked: "Отменить уборку",
    cancelCleaningOnBookedDesc: "Освободить дату от уборки — выберите другой день.",
    removeCleaningDescAuto: "Вернуть автоматическое определение.",
    cancelCleaningOnAuto: "Отменить уборку",
    cancelCleaningOnAutoDesc: "Освободить дату — выберите другой день для уборки.",
    blockAll: (count) => `Заблокировать все (${count})`,
    scheduleAll: (count) => `Запланировать уборку (${count})`,
    openAll: (count) => `Сделать доступными (${count})`,
    resetAll: (count) => `Сбросить переопределения (${count})`,
    createBulk: (count) => `Создать бронь на ${count} ${count === 1 ? "ночь" : "ночей"}`,
    createBulkDesc: "Одна бронь на все выбранные дни.",
    noActions: "Нет доступных действий.",
    selectedDates: "Выбрано дат",
    daysCount: () => "дн.",
    bookedDisabled: (count) => `${count} с бронями — массовые действия отключены`,
    contiguousRange: "Дни идут подряд",
    nonContiguous: "Не подряд",
    close: "Закрыть",
    checkingOut: "выезжает",
    checkingIn: "заезжает",
    singleDayStay: "однодневная бронь",
    staying: "проживает",
    cleanLabel: "Уборка",
    cleaningScheduled: "Уборка подтверждена",
    cleaningRequired: "Нужна уборка",
    betweenStays: "между бронями",
    removeFromSelection: "Убрать из выделения",
    guestName: "Имя гостя",
    guestNamePlaceholder: "Иван Петров",
    platform: "Платформа",
    platformDirect: "Напрямую",
    checkInLabel: "Заезд:",
    checkOutLabel: "Выезд:",
    nightsParenthetical: (count) => `(${count} ${count === 1 ? "ночь" : "ночей"})`,
    linkToBooking: "Привязать к существующей броне",
    beforeCheckIn: "перед заездом",
    afterCheckOut: "после выезда",
    stayLabel: "Бронь",
    addNights: (nights, side) =>
      `Добавить ${nights} ${nights === 1 ? "ночь" : "ночей"} ${side}`,
    cancel: "Отмена",
    saving: "Сохраняю…",
    save: "Сохранить",
  },
  de: {
    dateLocale: "de-DE",
    staysTurnover: (count) => `${count} ${count === 1 ? "Aufenthalt" : "Aufenthalte"} — Wechsel`,
    manualCleaning: "Manuelle Reinigung",
    blockDate: "Datum sperren",
    blockDateDesc: "Neue Buchungen verhindern. Kein Reinigungs-Chip.",
    scheduleCleaning: "Reinigung planen",
    scheduleCleaningDesc: "Datum sperren und als Reinigungstermin markieren.",
    makeAvailable: "Für Buchung freigeben",
    makeAvailableDesc: "Puffer / Mindestnächte für dieses Datum ignorieren.",
    unblockDate: "Sperre aufheben",
    removeCleaning: "Reinigung entfernen",
    resetOverride: "Auf Standard zurücksetzen",
    resetOverrideDesc: "Datum wieder auf den automatisch erkannten Zustand setzen.",
    createReservation: "Buchung anlegen",
    createReservationDesc: "Eine Buchung ab diesem Datum hinzufügen.",
    cancelCleaningOnBooked: "Reinigung absagen",
    cancelCleaningOnBookedDesc: "Datum von der Reinigung freihalten — an einem anderen Tag planen.",
    removeCleaningDescAuto: "Zurück zur automatisch erkannten Empfehlung.",
    cancelCleaningOnAuto: "Reinigung absagen",
    cancelCleaningOnAutoDesc: "Datum freigeben — Reinigung auf einen anderen Tag legen.",
    blockAll: (count) => `Alle sperren (${count})`,
    scheduleAll: (count) => `Reinigung planen (${count})`,
    openAll: (count) => `Freigeben (${count})`,
    resetAll: (count) => `Übersteuerungen zurücksetzen (${count})`,
    createBulk: (count) => `Buchung anlegen (${count} ${count === 1 ? "Nacht" : "Nächte"})`,
    createBulkDesc: "Eine Buchung über alle ausgewählten Tage.",
    noActions: "Keine Aktionen verfügbar.",
    selectedDates: "Ausgewählte Daten",
    daysCount: (count) => (count === 1 ? "Tag" : "Tage"),
    bookedDisabled: (count) => `${count} gebucht — Sammelaktionen deaktiviert`,
    contiguousRange: "Zusammenhängender Bereich",
    nonContiguous: "Nicht zusammenhängend",
    close: "Schließen",
    checkingOut: "Check-out",
    checkingIn: "Check-in",
    singleDayStay: "eintägiger Aufenthalt",
    staying: "im Haus",
    cleanLabel: "Reinigung",
    cleaningScheduled: "Reinigung geplant",
    cleaningRequired: "Reinigung nötig",
    betweenStays: "zwischen Aufenthalten",
    removeFromSelection: "Aus Auswahl entfernen",
    guestName: "Gastname",
    guestNamePlaceholder: "Max Mustermann",
    platform: "Plattform",
    platformDirect: "Direkt",
    checkInLabel: "Check-in:",
    checkOutLabel: "Check-out:",
    nightsParenthetical: (count) => `(${count} ${count === 1 ? "Nacht" : "Nächte"})`,
    linkToBooking: "Mit bestehender Buchung verknüpfen",
    beforeCheckIn: "vor Check-in",
    afterCheckOut: "nach Check-out",
    stayLabel: "Aufenthalt",
    addNights: (nights, side) =>
      `${nights} ${nights === 1 ? "Nacht" : "Nächte"} ${side} hinzufügen`,
    cancel: "Abbrechen",
    saving: "Wird gespeichert…",
    save: "Speichern",
  },
  fr: {
    dateLocale: "fr-FR",
    staysTurnover: (count) => `${count} séjours — rotation`,
    manualCleaning: "Ménage manuel",
    blockDate: "Bloquer cette date",
    blockDateDesc: "Empêche les nouvelles réservations. Sans pastille de ménage.",
    scheduleCleaning: "Planifier un ménage",
    scheduleCleaningDesc: "Bloque la date et la marque comme créneau de ménage.",
    makeAvailable: "Rendre disponible à la réservation",
    makeAvailableDesc: "Ignore le buffer / les nuits minimum pour cette date.",
    unblockDate: "Débloquer cette date",
    removeCleaning: "Retirer le ménage",
    resetOverride: "Revenir au comportement par défaut",
    resetOverrideDesc: "Rendre à cette date son état détecté automatiquement.",
    createReservation: "Créer une réservation",
    createReservationDesc: "Ajouter une réservation démarrant à cette date.",
    cancelCleaningOnBooked: "Annuler le ménage",
    cancelCleaningOnBookedDesc: "Libère cette date du ménage — planifiez-le un autre jour.",
    removeCleaningDescAuto: "Revenir à la suggestion détectée automatiquement.",
    cancelCleaningOnAuto: "Annuler le ménage",
    cancelCleaningOnAutoDesc: "Libère cette date — planifiez le ménage un autre jour.",
    blockAll: (count) => `Tout bloquer (${count})`,
    scheduleAll: (count) => `Planifier un ménage (${count})`,
    openAll: (count) => `Rendre disponibles (${count})`,
    resetAll: (count) => `Réinitialiser les overrides (${count})`,
    createBulk: (count) => `Créer une réservation (${count} ${count === 1 ? "nuit" : "nuits"})`,
    createBulkDesc: "Une seule réservation couvrant tous les jours sélectionnés.",
    noActions: "Aucune action disponible.",
    selectedDates: "Dates sélectionnées",
    daysCount: (count) => (count === 1 ? "jour" : "jours"),
    bookedDisabled: (count) => `${count} réservées — actions groupées désactivées`,
    contiguousRange: "Plage continue",
    nonContiguous: "Non contiguës",
    close: "Fermer",
    checkingOut: "départ",
    checkingIn: "arrivée",
    singleDayStay: "séjour d’un jour",
    staying: "sur place",
    cleanLabel: "Ménage",
    cleaningScheduled: "Ménage planifié",
    cleaningRequired: "Ménage requis",
    betweenStays: "entre deux séjours",
    removeFromSelection: "Retirer de la sélection",
    guestName: "Nom du voyageur",
    guestNamePlaceholder: "Jean Dupont",
    platform: "Plateforme",
    platformDirect: "Direct",
    checkInLabel: "Arrivée :",
    checkOutLabel: "Départ :",
    nightsParenthetical: (count) => `(${count} ${count === 1 ? "nuit" : "nuits"})`,
    linkToBooking: "Rattacher à une réservation existante",
    beforeCheckIn: "avant l’arrivée",
    afterCheckOut: "après le départ",
    stayLabel: "Séjour",
    addNights: (nights, side) =>
      `Ajouter ${nights} ${nights === 1 ? "nuit" : "nuits"} ${side}`,
    cancel: "Annuler",
    saving: "Enregistrement…",
    save: "Enregistrer",
  },
  es: {
    dateLocale: "es-ES",
    staysTurnover: (count) => `${count} ${count === 1 ? "estancia" : "estancias"} — rotación`,
    manualCleaning: "Limpieza manual",
    blockDate: "Bloquear esta fecha",
    blockDateDesc: "Detiene nuevas reservas. Sin chip de limpieza.",
    scheduleCleaning: "Programar limpieza",
    scheduleCleaningDesc: "Bloquea la fecha y la marca como turno de limpieza.",
    makeAvailable: "Habilitar para reservar",
    makeAvailableDesc: "Ignora el buffer y las noches mínimas para esta fecha.",
    unblockDate: "Desbloquear esta fecha",
    removeCleaning: "Quitar limpieza",
    resetOverride: "Restablecer al estado por defecto",
    resetOverrideDesc: "Devuelve la fecha a su estado detectado automáticamente.",
    createReservation: "Crear reserva",
    createReservationDesc: "Añade una reserva que empiece en esta fecha.",
    cancelCleaningOnBooked: "Cancelar limpieza",
    cancelCleaningOnBookedDesc: "Libera esta fecha de la limpieza — prográmela otro día.",
    removeCleaningDescAuto: "Vuelve a la sugerencia detectada automáticamente.",
    cancelCleaningOnAuto: "Cancelar limpieza",
    cancelCleaningOnAutoDesc: "Libera esta fecha — programe la limpieza otro día.",
    blockAll: (count) => `Bloquear todas (${count})`,
    scheduleAll: (count) => `Programar limpieza (${count})`,
    openAll: (count) => `Habilitar (${count})`,
    resetAll: (count) => `Restablecer overrides (${count})`,
    createBulk: (count) => `Crear reserva (${count} ${count === 1 ? "noche" : "noches"})`,
    createBulkDesc: "Una sola reserva que cubre todos los días seleccionados.",
    noActions: "No hay acciones disponibles.",
    selectedDates: "Fechas seleccionadas",
    daysCount: (count) => (count === 1 ? "día" : "días"),
    bookedDisabled: (count) => `${count} reservadas — acciones masivas desactivadas`,
    contiguousRange: "Rango continuo",
    nonContiguous: "No continuo",
    close: "Cerrar",
    checkingOut: "salida",
    checkingIn: "entrada",
    singleDayStay: "estancia de un día",
    staying: "alojado",
    cleanLabel: "Limpieza",
    cleaningScheduled: "Limpieza programada",
    cleaningRequired: "Limpieza necesaria",
    betweenStays: "entre estancias",
    removeFromSelection: "Quitar de la selección",
    guestName: "Nombre del huésped",
    guestNamePlaceholder: "Juan García",
    platform: "Plataforma",
    platformDirect: "Directa",
    checkInLabel: "Entrada:",
    checkOutLabel: "Salida:",
    nightsParenthetical: (count) => `(${count} ${count === 1 ? "noche" : "noches"})`,
    linkToBooking: "Vincular a una reserva existente",
    beforeCheckIn: "antes de la entrada",
    afterCheckOut: "después de la salida",
    stayLabel: "Estancia",
    addNights: (nights, side) =>
      `Añadir ${nights} ${nights === 1 ? "noche" : "noches"} ${side}`,
    cancel: "Cancelar",
    saving: "Guardando…",
    save: "Guardar",
  },
};

export interface DateStatus {
  hasBar: boolean;
  isBuffer: boolean;
  isPotential: boolean;
  isSameDayCleaning: boolean;
  isUnbookable: boolean;
  isOpenOverride: boolean;
  isClosedOverride: boolean;
  isManualCleaning: boolean;
}

export interface DateBarInfo {
  name: string;
  platform: string;
  role: "checkout" | "checkin" | "midstay" | "fullday";
  reservationId?: number;
  eventUid?: string;
  linkedEventUid?: string;
}

export interface ExtendableBooking {
  name: string;
  platform: string;
  eventUid?: string;
  /** Original stay window of the booking we're appending to —
   *  shown in the panel so the host sees the full context (e.g.
   *  "Iain · May 3 → May 9") instead of the bare iCal SUMMARY. */
  bookingStart: string;
  bookingEnd: string;
  side: "before" | "after";
}

interface BulkCounts {
  booked: number;
  openOverride: number;
  closedOverride: number;
  cleaningOverride: number;
  /** Selected dates that are auto-flagged unavailable by the system
   *  (buffer / same-day cleaning / unbookable / potential cleaning).
   *  Used to decide whether the bulk "Make available" action makes
   *  sense — without this we would show it on already-free dates. */
  autoBlocked: number;
}

interface DateActionsPanelProps {
  /** Always at least one entry. Single = 1, bulk = 2+. */
  selectedDates: string[];
  /** When exactly one date is selected, single-date detail. */
  singleDate: string | null;
  singleDateBars: DateBarInfo[];
  /** Bookings the WHOLE selection could be appended to (extend
   *  before / after). For a single-date selection this is the same
   *  set the per-date popup used to compute. For a multi-date
   *  contiguous selection these are bookings whose start equals
   *  last+1 or whose end equals first. */
  extendable: ExtendableBooking[];
  /** Whether the multi-date selection is contiguous — drives whether
   *  Create reservation / Extend booking are offered. */
  isContiguousRange: boolean;
  singleStatus: DateStatus | null;
  /** Aggregate flags across the entire selection — drives the bulk
   *  action list when 2+ dates are selected. */
  bulkCounts: BulkCounts;
  onClose: () => void;
  onToggleDate: (dateStr: string) => void;
  onCloseDate: () => void;
  onOpenDate: () => void;
  onScheduleCleaning: () => void;
  onRemoveOverride: () => void;
  onExtendBooking: (booking: ExtendableBooking) => void;
  onCreateReservation: (data: { name: string; platform: string }) => void;
}

type ActionKind =
  | "block"
  | "scheduleCleaning"
  | "openForBooking"
  | "removeOverride"
  | "removeBlock"
  | "removeCleaning"
  | "createReservation";

interface ResolvedAction {
  kind: ActionKind;
  label: string;
  description?: string;
  tone: "neutral" | "block" | "open" | "cleaning" | "primary";
  onClick: () => void;
}

export function DateActionsPopover({
  selectedDates,
  singleDate,
  singleDateBars,
  extendable,
  isContiguousRange,
  singleStatus,
  bulkCounts,
  onClose,
  onToggleDate,
  onCloseDate,
  onOpenDate,
  onScheduleCleaning,
  onRemoveOverride,
  onExtendBooking,
  onCreateReservation,
}: DateActionsPanelProps) {
  const { t, locale } = useI18n();
  const c = COPY[locale];
  const popRef = useRef<HTMLDivElement>(null);
  const [creating, setCreating] = useState(false);
  const [resName, setResName] = useState("");
  const [resPlatform, setResPlatform] = useState<string>("airbnb");
  const [submitting, setSubmitting] = useState(false);

  // Reset the create-reservation form whenever the selection changes
  // (e.g. user added another date). Otherwise typed name would carry
  // over into a different selection state.
  useEffect(() => {
    setCreating(false);
    setResName("");
    setResPlatform("airbnb");
    setSubmitting(false);
  }, [selectedDates.join(",")]);

  // Use the contiguous-range flag passed in by the wrapper (shared
  // with the extendable computation so they stay consistent).
  const isContiguous = isContiguousRange;

  const allUnbooked = bulkCounts.booked === 0;
  // Has anything in the selection that "Make available" would
  // actually unblock — without this the bulk panel would offer the
  // action on dates that are already free.
  const someNeedsOpening =
    bulkCounts.closedOverride > 0 ||
    bulkCounts.cleaningOverride > 0 ||
    bulkCounts.autoBlocked > 0;

  // Single-date mode header status text — matches old per-date popup.
  const singleStatusText = (() => {
    if (!singleStatus) return "";
    if (singleStatus.hasBar) {
      if (singleDateBars.length > 1) {
        return c.staysTurnover(singleDateBars.length);
      }
      return t("dateActions.statusBooked", { name: singleDateBars[0]?.name || "—" });
    }
    if (singleStatus.isOpenOverride) return t("dateActions.statusOpen");
    if (singleStatus.isManualCleaning) return c.manualCleaning;
    if (singleStatus.isClosedOverride) return t("dateActions.statusClosed");
    if (singleStatus.isBuffer) return t("dateActions.statusCleaning");
    if (singleStatus.isSameDayCleaning) return t("dateActions.statusCleaning");
    if (singleStatus.isPotential) return t("dateActions.statusPotential");
    if (singleStatus.isUnbookable) return t("dateActions.statusUnbookable");
    return t("dateActions.statusFree");
  })();

  const isLinkedPair = (a: DateBarInfo, b: DateBarInfo) =>
    (!!a.eventUid && a.eventUid === b.linkedEventUid) ||
    (!!b.eventUid && b.eventUid === a.linkedEventUid);

  const cleaningBetweenIndex = (() => {
    for (let i = 0; i < singleDateBars.length - 1; i++) {
      const a = singleDateBars[i];
      const b = singleDateBars[i + 1];
      if (a.role === "checkout" && b.role === "checkin" && !isLinkedPair(a, b)) {
        return i;
      }
    }
    return -1;
  })();

  const formatHeaderDate = (s: string) =>
    new Date(s + "T12:00:00").toLocaleDateString(c.dateLocale, {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const formatShort = (s: string) =>
    new Date(s + "T12:00:00").toLocaleDateString(c.dateLocale, {
      day: "2-digit",
      month: "short",
    });

  // Single-date actions (per-state, same logic as before).
  const singleActions: ResolvedAction[] = (() => {
    if (!singleStatus) return [];
    const lBlock = c.blockDate;
    const lBlockDesc = c.blockDateDesc;
    const lSchedule = c.scheduleCleaning;
    const lScheduleDesc = c.scheduleCleaningDesc;
    const lOpen = c.makeAvailable;
    const lOpenDesc = c.makeAvailableDesc;
    const lUnblock = c.unblockDate;
    const lRemoveCleaning = c.removeCleaning;
    const lRemoveOverride = c.resetOverride;
    const lRemoveOverrideDesc = c.resetOverrideDesc;
    const lCreate = c.createReservation;
    const lCreateDesc = c.createReservationDesc;
    const createAction: ResolvedAction = { kind: "createReservation", label: lCreate, description: lCreateDesc, tone: "primary", onClick: () => setCreating(true) };

    if (singleStatus.hasBar) {
      // On a booked day the only meaningful actions are around the
      // cleaning chip. Cases:
      //
      //   * Manual cleaning override → "Cancel cleaning" deletes the
      //     override (back to auto-detected state, which on a turnover
      //     or end-of-stay day still shows the Cleaning chip via
      //     sameDayCleaning).
      //   * Auto sameDayCleaning chip → "Cancel cleaning" sets an
      //     `open` override that suppresses the auto chip.
      //   * Booked day with no cleaning chip at all (e.g. mid-stay
      //     day, OR a check-in day where the next guest's bar covers
      //     the date but auto-cleaning didn't pick it because it's
      //     a check-in) → host should still be able to schedule a
      //     manual cleaning. Auto-cleaning can't go on a check-in
      //     day, but the host knows their cleaner's calendar best
      //     and may want the cleaner there before the next check-in.
      //     Previously this case returned [] — no actions at all,
      //     so the host had no UI path to schedule cleaning on a
      //     booked day. Now it surfaces "Schedule cleaning" as a
      //     manual override that overrides the auto-cleaning logic.
      const lRemoveCleaningDesc = c.removeCleaningDescAuto;
      const lCancelCleaning = c.cancelCleaningOnBooked;
      const lCancelCleaningDesc = c.cancelCleaningOnBookedDesc;
      if (singleStatus.isManualCleaning) {
        return [{ kind: "removeCleaning", label: lCancelCleaning, description: lRemoveCleaningDesc, tone: "open", onClick: onRemoveOverride }];
      }
      if (singleStatus.isSameDayCleaning) {
        return [{ kind: "openForBooking", label: lCancelCleaning, description: lCancelCleaningDesc, tone: "open", onClick: onOpenDate }];
      }
      // Booked day, no cleaning chip — give the host the manual
      // override action so they can force a cleaning here.
      return [{ kind: "scheduleCleaning", label: lSchedule, description: lScheduleDesc, tone: "cleaning", onClick: onScheduleCleaning }];
    }
    if (singleStatus.isManualCleaning) {
      return [createAction, { kind: "removeCleaning", label: lRemoveCleaning, description: lRemoveOverrideDesc, tone: "open", onClick: onRemoveOverride }, { kind: "block", label: lBlock, description: lBlockDesc, tone: "block", onClick: onCloseDate }];
    }
    if (singleStatus.isClosedOverride) {
      return [createAction, { kind: "removeBlock", label: lUnblock, description: lRemoveOverrideDesc, tone: "open", onClick: onRemoveOverride }];
    }
    if (singleStatus.isOpenOverride) {
      return [createAction, { kind: "removeOverride", label: lRemoveOverride, description: lRemoveOverrideDesc, tone: "neutral", onClick: onRemoveOverride }, { kind: "block", label: lBlock, description: lBlockDesc, tone: "block", onClick: onCloseDate }, { kind: "scheduleCleaning", label: lSchedule, description: lScheduleDesc, tone: "cleaning", onClick: onScheduleCleaning }];
    }
    // Auto-detected unavailable. Two label flavours:
    //   * Cleaning days (buffer / same-day / potential): "Cancel
    //     cleaning" — the host's mental model is "the cleaner is
    //     not coming this day, schedule it elsewhere".
    //   * Min-nights blocks (unbookable): "Make available" — the
    //     date is locked for booking-fit reasons, no cleaning concept.
    if (singleStatus.isBuffer || singleStatus.isSameDayCleaning || singleStatus.isPotential) {
      const lCancelCleaning = c.cancelCleaningOnAuto;
      const lCancelCleaningDesc = c.cancelCleaningOnAutoDesc;
      return [createAction, { kind: "openForBooking", label: lCancelCleaning, description: lCancelCleaningDesc, tone: "open", onClick: onOpenDate }];
    }
    if (singleStatus.isUnbookable) {
      return [createAction, { kind: "openForBooking", label: lOpen, description: lOpenDesc, tone: "open", onClick: onOpenDate }];
    }
    return [createAction, { kind: "block", label: lBlock, description: lBlockDesc, tone: "block", onClick: onCloseDate }, { kind: "scheduleCleaning", label: lSchedule, description: lScheduleDesc, tone: "cleaning", onClick: onScheduleCleaning }];
  })();

  // Bulk-mode actions: simpler — operate on the whole selection.
  const bulkActions: ResolvedAction[] = (() => {
    const lBlockAll = c.blockAll(selectedDates.length);
    const lScheduleAll = c.scheduleAll(selectedDates.length);
    const lOpenAll = c.openAll(selectedDates.length);
    const lResetAll = c.resetAll(selectedDates.length);
    const lCreate = c.createBulk(selectedDates.length);
    const lCreateDesc = c.createBulkDesc;

    const out: ResolvedAction[] = [];

    if (allUnbooked && isContiguous) {
      out.push({ kind: "createReservation", label: lCreate, description: lCreateDesc, tone: "primary", onClick: () => setCreating(true) });
    }
    if (allUnbooked) {
      out.push({ kind: "block", label: lBlockAll, tone: "block", onClick: onCloseDate });
      out.push({ kind: "scheduleCleaning", label: lScheduleAll, tone: "cleaning", onClick: onScheduleCleaning });
      // "Make available" only when at least one selected date is
      // actually unavailable — otherwise the action is a no-op on
      // already-free days.
      if (someNeedsOpening) {
        out.push({ kind: "openForBooking", label: lOpenAll, tone: "open", onClick: onOpenDate });
      }
    }
    if (bulkCounts.openOverride + bulkCounts.closedOverride + bulkCounts.cleaningOverride > 0) {
      out.push({ kind: "removeOverride", label: lResetAll, tone: "neutral", onClick: onRemoveOverride });
    }
    return out;
  })();

  const toneClass = (tone: ResolvedAction["tone"]) => {
    switch (tone) {
      case "primary":
        return "bg-[var(--m-accent)] text-white hover:bg-[var(--m-accent-2)]";
      case "block":
        return "hover:bg-rose-500/10 hover:text-rose-500";
      case "open":
        return "hover:bg-emerald-500/10 hover:text-emerald-500";
      case "cleaning":
        return "hover:bg-[var(--cleaning-bg)] hover:text-[var(--cleaning-fg)]";
      default:
        return "hover:bg-[var(--bg-3)]";
    }
  };

  const iconFor = (kind: ActionKind) => {
    switch (kind) {
      case "createReservation":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        );
      case "block":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        );
      case "scheduleCleaning":
        // Sparkles glyph — reads as "make this clean / sparkly"
        // and works for both auto-cleaning and manual scheduling.
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
          </svg>
        );
      case "openForBooking":
      case "removeBlock":
      case "removeCleaning":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        );
      case "removeOverride":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        );
    }
  };

  const submitCreate = async () => {
    const finalName = resName.trim();
    if (!finalName) return;
    setSubmitting(true);
    try {
      onCreateReservation({ name: finalName, platform: resPlatform });
    } finally {
      setSubmitting(false);
    }
  };

  const singleStatusBadgeClass = !singleStatus
    ? ""
    : singleStatus.hasBar
      ? "bg-[var(--m-accent)]/10 text-[var(--m-accent)]"
      : singleStatus.isOpenOverride
        ? "bg-emerald-500/10 text-emerald-500"
        : singleStatus.isManualCleaning
          ? "bg-[var(--cleaning-bg)] text-[var(--cleaning-fg)]"
          : singleStatus.isClosedOverride
            ? "bg-rose-500/10 text-rose-500"
            : (singleStatus.isBuffer || singleStatus.isSameDayCleaning)
              ? "bg-[var(--cleaning-bg)] text-[var(--cleaning-fg)]"
              : singleStatus.isPotential
                ? "bg-[var(--ink)]/5 text-[var(--ink-2)]"
                : singleStatus.isUnbookable
                  ? "bg-[var(--ink-4)]/10 text-[var(--ink-3)]"
                  : "bg-emerald-500/10 text-emerald-500";

  const renderActionsList = (actions: ResolvedAction[]) =>
    actions.length === 0 ? (
      <div className="px-3 py-2 text-xs text-[var(--ink-4)]">
        {c.noActions}
      </div>
    ) : (
      actions.map((a) => (
        <button
          key={a.kind + a.label}
          onClick={a.onClick}
          className={`w-full flex items-start gap-2.5 rounded-md px-3 py-2.5 text-left transition-colors ${a.tone === "primary" ? "" : "text-[var(--ink)]"} ${toneClass(a.tone)}`}
        >
          <span className={`mt-0.5 shrink-0 ${a.tone === "primary" ? "text-white" : ""}`}>{iconFor(a.kind)}</span>
          <span className="flex-1 min-w-0">
            <span className={`block text-sm font-medium ${a.tone === "primary" ? "text-white" : ""}`}>{a.label}</span>
            {a.description && (
              <span className={`block text-[11px] mt-0.5 leading-snug ${a.tone === "primary" ? "text-white/80" : "text-[var(--ink-4)]"}`}>{a.description}</span>
            )}
          </span>
        </button>
      ))
    );

  // Renders inline as a flex sibling of the calendar (no portal). The
  // parent decides positioning — on desktop it's a sticky aside that
  // shares the centered max-w-[1760px] container with the calendar;
  // on mobile it stacks below or replaces the calendar.
  return (
    <div
      ref={popRef}
      className="flex h-full flex-col bg-[var(--bg)] animate-slide-in-right"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
        <div className="min-w-0 flex-1">
          {singleDate ? (
            <>
              <div className="text-xs uppercase tracking-wide text-[var(--ink-4)]">{t("dateActions.title")}</div>
              <div className="mt-0.5 text-base font-semibold text-[var(--ink)]">{formatHeaderDate(singleDate)}</div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-[var(--ink-4)]">{t("dateActions.status")}:</span>
                <span className={`rounded px-1.5 py-0.5 font-medium ${singleStatusBadgeClass}`}>{singleStatusText}</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs uppercase tracking-wide text-[var(--ink-4)]">
                {c.selectedDates}
              </div>
              <div className="mt-0.5 text-base font-semibold text-[var(--ink)]">
                {selectedDates.length} {c.daysCount(selectedDates.length)}
                {isContiguous && selectedDates.length > 1 && (
                  <span className="ml-2 text-sm font-normal text-[var(--ink-3)]">
                    {formatShort(selectedDates[0])} → {formatShort(selectedDates[selectedDates.length - 1])}
                  </span>
                )}
              </div>
              <div className="mt-2 text-[11px] text-[var(--ink-3)]">
                {bulkCounts.booked > 0
                  ? c.bookedDisabled(bulkCounts.booked)
                  : isContiguous
                    ? c.contiguousRange
                    : c.nonContiguous}
              </div>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label={c.close}
          className="shrink-0 rounded-full p-1.5 text-[var(--ink-3)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)] transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
        {/* Single-date day timeline. All entries — guest bars AND the
            inline cleaning notice — share the same [badge | title /
            sub-line] row layout so the visual rhythm stays consistent.
            The badge is the only element that swaps colour to convey
            event type. */}
        {singleDate && singleDateBars.length > 0 && (
          <div className="border-b border-[var(--line)] px-5 py-4 space-y-3">
            {singleDateBars.map((b, i) => {
              const platformColor = b.platform === "booking" ? "#003580" : "#ff385c";
              const platformLabel = b.platform === "booking" ? "Booking" : b.platform === "airbnb" ? "Airbnb" : b.platform;
              const roleLabel = b.role === "checkout"
                ? c.checkingOut
                : b.role === "checkin"
                  ? c.checkingIn
                  : b.role === "fullday"
                    ? c.singleDayStay
                    : c.staying;
              return (
                /* Two-column grid: a fixed 64px badge column + a flexible
                   description column. Badges stay their natural width
                   (left-aligned in column 1 via the inner span); the
                   title + sub-line in column 2 always start at the same
                   x-coord regardless of badge text length, so the rhythm
                   reads as a clean two-column timeline. */
                <div key={`bar-${i}`} className="space-y-3">
                  <div className="grid grid-cols-[64px_1fr] items-start gap-x-3">
                    <span
                      className="justify-self-start mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white"
                      style={{ backgroundColor: platformColor }}
                    >
                      {platformLabel}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium leading-tight text-[var(--ink)]">{b.name}</div>
                      <div className="mt-0.5 text-[11px] leading-tight text-[var(--ink-3)]">{roleLabel}</div>
                    </div>
                  </div>
                  {i === cleaningBetweenIndex && (
                    <div className="grid grid-cols-[64px_1fr] items-start gap-x-3">
                      <span className="justify-self-start mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide bg-[var(--cleaning-bg)] text-[var(--cleaning-fg)] border border-[var(--cleaning-border)]">
                        {c.cleanLabel}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium leading-tight text-[var(--ink)]">
                          {singleStatus?.isManualCleaning ? c.cleaningScheduled : c.cleaningRequired}
                        </div>
                        <div className="mt-0.5 text-[11px] leading-tight text-[var(--ink-3)]">
                          {c.betweenStays}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Multi-date selection list — chips with toggle to remove */}
        {!singleDate && (
          <div className="border-b border-[var(--line)] px-5 py-4">
            <div className="flex flex-wrap gap-1.5">
              {selectedDates.map((d) => (
                <button
                  key={d}
                  onClick={() => onToggleDate(d)}
                  className="group inline-flex items-center gap-1 rounded-full border border-[var(--m-accent)]/30 bg-[var(--m-accent)]/10 px-2 py-1 text-[11px] font-medium text-[var(--m-accent)] hover:bg-[var(--m-accent)]/20 transition-colors"
                  title={c.removeFromSelection}
                >
                  {formatShort(d)}
                  <svg className="h-3 w-3 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create-reservation form (shared by single + bulk modes) */}
        {creating ? (
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)] mb-1.5">
                {c.guestName}
              </label>
              <input
                autoFocus
                value={resName}
                onChange={(e) => setResName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitCreate();
                  }
                }}
                placeholder={c.guestNamePlaceholder}
                className="h-10 w-full rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-3 text-sm text-[var(--ink)] placeholder-[var(--ink-4)] outline-none focus:border-[var(--m-accent)] focus:ring-1 focus:ring-[var(--m-accent)]/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)] mb-1.5">
                {c.platform}
              </label>
              <div className="flex gap-2">
                {[
                  { code: "airbnb", label: "Airbnb", color: "#ff385c" },
                  { code: "booking", label: "Booking", color: "#003580" },
                  { code: "direct", label: c.platformDirect, color: "#6b6b73" },
                ].map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => setResPlatform(p.code)}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                      resPlatform === p.code
                        ? "border-transparent text-white"
                        : "border-[var(--line-2)] bg-[var(--bg-2)] text-[var(--ink-2)] hover:bg-[var(--bg-3)]"
                    }`}
                    style={resPlatform === p.code ? { backgroundColor: p.color } : undefined}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] p-3 text-xs text-[var(--ink-3)]">
              <div>
                <span className="text-[var(--ink-4)]">{c.checkInLabel}</span>{" "}
                <span className="font-medium text-[var(--ink)]">{formatShort(selectedDates[0])}</span>
              </div>
              <div className="mt-1">
                <span className="text-[var(--ink-4)]">{c.checkOutLabel}</span>{" "}
                <span className="font-medium text-[var(--ink)]">
                  {(() => {
                    const last = selectedDates[selectedDates.length - 1];
                    const d = new Date(last + "T12:00:00");
                    d.setDate(d.getDate() + 1);
                    return d.toLocaleDateString(c.dateLocale, { day: "2-digit", month: "short" });
                  })()}
                </span>{" "}
                <span className="text-[var(--ink-4)]">
                  {c.nightsParenthetical(selectedDates.length)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Action list */
          <div className="px-2.5 py-2.5">
            {singleDate ? renderActionsList(singleActions) : renderActionsList(bulkActions)}

            {/* Extend booking — works for single-date OR multi-date
                contiguous selection. Each card shows the platform
                pill, the guest name, the original stay window and a
                "Extend by N nights" CTA so the host knows exactly
                what they're appending to before clicking. */}
            {extendable.length > 0 && bulkCounts.booked === 0 && isContiguous && (
              <div className="mt-2 border-t border-[var(--line)] pt-2 px-1.5">
                <div className="px-1.5 py-1.5 text-[11px] uppercase tracking-wide text-[var(--ink-4)]">
                  {c.linkToBooking}
                </div>
                {extendable.map((b, i) => {
                  const platformColor = b.platform === "booking" ? "#003580" : "#ff385c";
                  const platformLabel = b.platform === "booking" ? "Booking" : b.platform === "airbnb" ? "Airbnb" : b.platform;
                  const nights = selectedDates.length;
                  const sideLabel = b.side === "before" ? c.beforeCheckIn : c.afterCheckOut;
                  return (
                    <button
                      key={i}
                      onClick={() => onExtendBooking(b)}
                      className="w-full mb-1.5 last:mb-0 rounded-lg border border-[var(--line-2)] bg-[var(--bg-2)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-3)]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white"
                          style={{ backgroundColor: platformColor }}
                        >
                          {platformLabel}
                        </span>
                        <span className="flex-1 min-w-0 truncate text-sm font-medium text-[var(--ink)]">{b.name}</span>
                        <svg className="h-3.5 w-3.5 shrink-0 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={b.side === "before" ? "M8.25 4.5l7.5 7.5-7.5 7.5" : "M15.75 19.5L8.25 12l7.5-7.5"} />
                        </svg>
                      </div>
                      <div className="mt-1 text-[11px] text-[var(--ink-3)]">
                        {c.stayLabel}: <span className="text-[var(--ink-2)]">{formatShort(b.bookingStart)} → {formatShort(b.bookingEnd)}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] font-medium text-[var(--m-accent)]">
                        {c.addNights(nights, sideLabel)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky footer for the create form */}
      {creating && (
        <div className="border-t border-[var(--line)] px-5 py-3 flex gap-2">
          <button
            type="button"
            onClick={() => setCreating(false)}
            disabled={submitting}
            className="flex-1 rounded-md border border-[var(--line-2)] bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--ink-2)] hover:bg-[var(--bg-3)] transition-colors disabled:opacity-50"
          >
            {t("common.cancel") || c.cancel}
          </button>
          <button
            type="button"
            onClick={submitCreate}
            disabled={submitting || !resName.trim()}
            className="flex-1 rounded-md bg-[var(--m-accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--m-accent-2)] transition-colors disabled:opacity-50"
          >
            {submitting ? c.saving : c.save}
          </button>
        </div>
      )}
    </div>
  );
}
