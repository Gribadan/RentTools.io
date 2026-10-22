import type { Locale } from "@/lib/i18n/translations";

interface OverviewCopy {
  title: string;
  allProperties: string;
  previousMonth: string;
  nextMonth: string;
  month: string;
  search: string;
  datesHint: string;
  updating: string;
  unavailable: string;
  loading: string;
  loadingCalendar: string;
  retry: string;
  noProperties: string;
  noPropertiesDescription: string;
  noResults: string;
  noResultsDescription: string;
  clearSearch: string;
  emptyMonth: string;
  scrollRegion: string;
  occupancy: string;
  property: string;
  turnoverHint: string;
  buffer: string;
  unbookable: string;
  reservationDetails: string;
  backToOverview: string;
  loadingReservation: string;
  reservationUnavailable: string;
  requestFailed: string;
}

export const OVERVIEW_COPY: Record<Locale, OverviewCopy> = {
  en: {
    title: "All calendars", allProperties: "All properties", previousMonth: "Previous month", nextMonth: "Next month", month: "Month", search: "Search properties",
    datesHint: "Dates show nights before checkout. Scroll right →", updating: "Updating…", unavailable: "Calendar could not be loaded. Availability is unknown.",
    loading: "Loading…", loadingCalendar: "Loading calendar…", retry: "Retry", noProperties: "No properties yet", noPropertiesDescription: "Properties you can access will appear here.",
    noResults: "No matching properties", noResultsDescription: "Try another name or clear the search.", clearSearch: "Clear search", emptyMonth: "No bookings or blocks this month.",
    scrollRegion: "Property calendar, scroll horizontally", occupancy: "Property occupancy", property: "Property", turnoverHint: "Separate bars mark guest turnover. Overlapping stays appear on separate lines.",
    buffer: "Cleaning buffer", unbookable: "Gap too short", reservationDetails: "Reservation details", backToOverview: "Back to all calendars", loadingReservation: "Loading reservation…",
    reservationUnavailable: "Unable to load this reservation.", requestFailed: "Request failed",
  },
  ru: {
    title: "Общий календарь", allProperties: "Все объекты", previousMonth: "Предыдущий месяц", nextMonth: "Следующий месяц", month: "Месяц", search: "Поиск по названию объекта",
    datesHint: "Даты — ночи до выезда. Прокрутите вправо →", updating: "Обновление…", unavailable: "Не удалось загрузить календарь. Занятость неизвестна.",
    loading: "Загрузка…", loadingCalendar: "Загрузка календаря…", retry: "Повторить", noProperties: "Нет доступных объектов", noPropertiesDescription: "Здесь появятся объекты, к которым у вас есть доступ.",
    noResults: "Объекты не найдены", noResultsDescription: "Попробуйте другое название или очистите поиск.", clearSearch: "Сбросить поиск", emptyMonth: "В этом месяце нет бронирований или блокировок.",
    scrollRegion: "Календарь объектов, горизонтальная прокрутка", occupancy: "Занятость объектов", property: "Объект", turnoverHint: "Соседние полосы разделены границей смены гостей. Пересечения показаны отдельными полосами.",
    buffer: "Буфер уборки", unbookable: "Короткий промежуток", reservationDetails: "Карточка бронирования", backToOverview: "Вернуться в общий календарь", loadingReservation: "Загрузка бронирования…",
    reservationUnavailable: "Не удалось загрузить бронирование.", requestFailed: "Ошибка запроса",
  },
  de: {
    title: "Alle Kalender", allProperties: "Alle Unterkünfte", previousMonth: "Vorheriger Monat", nextMonth: "Nächster Monat", month: "Monat", search: "Unterkünfte suchen",
    datesHint: "Angezeigt werden Nächte vor der Abreise. Nach rechts scrollen →", updating: "Wird aktualisiert…", unavailable: "Kalender konnte nicht geladen werden. Verfügbarkeit unbekannt.",
    loading: "Wird geladen…", loadingCalendar: "Kalender wird geladen…", retry: "Erneut versuchen", noProperties: "Keine Unterkünfte verfügbar", noPropertiesDescription: "Unterkünfte, auf die Sie Zugriff haben, erscheinen hier.",
    noResults: "Keine passenden Unterkünfte", noResultsDescription: "Versuchen Sie einen anderen Namen oder löschen Sie die Suche.", clearSearch: "Suche löschen", emptyMonth: "Keine Buchungen oder Sperren in diesem Monat.",
    scrollRegion: "Unterkunftskalender, horizontal scrollen", occupancy: "Belegung der Unterkünfte", property: "Unterkunft", turnoverHint: "Getrennte Balken zeigen den Gästewechsel. Überlappende Aufenthalte stehen in separaten Zeilen.",
    buffer: "Reinigungspuffer", unbookable: "Lücke zu kurz", reservationDetails: "Buchungsdetails", backToOverview: "Zurück zu allen Kalendern", loadingReservation: "Buchung wird geladen…",
    reservationUnavailable: "Diese Buchung konnte nicht geladen werden.", requestFailed: "Anfrage fehlgeschlagen",
  },
  fr: {
    title: "Tous les calendriers", allProperties: "Tous les logements", previousMonth: "Mois précédent", nextMonth: "Mois suivant", month: "Mois", search: "Rechercher un logement",
    datesHint: "Les dates indiquent les nuits avant le départ. Faites défiler à droite →", updating: "Actualisation…", unavailable: "Impossible de charger le calendrier. Disponibilité inconnue.",
    loading: "Chargement…", loadingCalendar: "Chargement du calendrier…", retry: "Réessayer", noProperties: "Aucun logement disponible", noPropertiesDescription: "Les logements auxquels vous avez accès apparaîtront ici.",
    noResults: "Aucun logement trouvé", noResultsDescription: "Essayez un autre nom ou effacez la recherche.", clearSearch: "Effacer la recherche", emptyMonth: "Aucune réservation ni date bloquée ce mois-ci.",
    scrollRegion: "Calendrier des logements, défilement horizontal", occupancy: "Occupation des logements", property: "Logement", turnoverHint: "Les barres séparées indiquent un changement de voyageurs. Les séjours qui se chevauchent apparaissent sur des lignes distinctes.",
    buffer: "Marge de ménage", unbookable: "Intervalle trop court", reservationDetails: "Détails de la réservation", backToOverview: "Retour à tous les calendriers", loadingReservation: "Chargement de la réservation…",
    reservationUnavailable: "Impossible de charger cette réservation.", requestFailed: "Échec de la requête",
  },
  es: {
    title: "Todos los calendarios", allProperties: "Todos los alojamientos", previousMonth: "Mes anterior", nextMonth: "Mes siguiente", month: "Mes", search: "Buscar alojamientos",
    datesHint: "Las fechas muestran las noches antes de la salida. Desliza a la derecha →", updating: "Actualizando…", unavailable: "No se pudo cargar el calendario. Disponibilidad desconocida.",
    loading: "Cargando…", loadingCalendar: "Cargando calendario…", retry: "Reintentar", noProperties: "No hay alojamientos disponibles", noPropertiesDescription: "Aquí aparecerán los alojamientos a los que tienes acceso.",
    noResults: "No se encontraron alojamientos", noResultsDescription: "Prueba otro nombre o borra la búsqueda.", clearSearch: "Borrar búsqueda", emptyMonth: "No hay reservas ni bloqueos este mes.",
    scrollRegion: "Calendario de alojamientos, desplazamiento horizontal", occupancy: "Ocupación de alojamientos", property: "Alojamiento", turnoverHint: "Las barras separadas indican un cambio de huéspedes. Las estancias superpuestas aparecen en líneas distintas.",
    buffer: "Margen de limpieza", unbookable: "Intervalo muy corto", reservationDetails: "Detalles de la reserva", backToOverview: "Volver a todos los calendarios", loadingReservation: "Cargando reserva…",
    reservationUnavailable: "No se pudo cargar esta reserva.", requestFailed: "Error en la solicitud",
  },
};
