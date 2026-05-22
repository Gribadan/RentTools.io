"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import { SUPPORTED_LOCALES } from "@/lib/i18n/alternates";
import type { Property } from "@/lib/types";

interface CopyShape {
  tabDashboard: string;
  tabCalendar: string;
  tabCleaning: string;
  tabReports: string;
  tabProperty: string;
  allProperties: string;
  dashboardAll: string;
  countLabel: (resCount: number, guestCount: number) => string;
  addProperty: string;
  searchGuests: string;
  searchGuestsTitle: string;
  searchPlaceholder: string;
  closeSearch: string;
  searching: string;
  noMatches: string;
  userMenu: string;
  personalAccount: string;
  theme: string;
  language: string;
  admin: string;
  syncTasks: string;
  refreshAll: string;
  refreshingAll: string;
  refreshAllDone: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    tabDashboard: "Dashboard",
    tabCalendar: "Calendar",
    tabCleaning: "Cleaning",
    tabReports: "Reports",
    tabProperty: "Property",
    allProperties: "All properties",
    dashboardAll: "Dashboard (all)",
    countLabel: (resCount, guestCount) =>
      `${resCount} ${resCount === 1 ? "reservation" : "reservations"}, ${guestCount} ${guestCount === 1 ? "guest" : "guests"}`,
    addProperty: "Add property",
    searchGuests: "Search guests",
    searchGuestsTitle: "Search guests (⌘K)",
    searchPlaceholder: "Name, passport, country…",
    closeSearch: "Close search",
    searching: "Searching...",
    noMatches: "No matches",
    userMenu: "User menu",
    personalAccount: "Personal account",
    theme: "Theme",
    language: "Language",
    admin: "Admin",
    syncTasks: "Sync tasks",
    refreshAll: "Refresh all calendars",
    refreshingAll: "Refreshing…",
    refreshAllDone: "Calendars updated",
  },
  ru: {
    tabDashboard: "Обзор",
    tabCalendar: "Календарь",
    tabCleaning: "Уборки",
    tabReports: "Отчёты",
    tabProperty: "Объект",
    allProperties: "Все объекты",
    dashboardAll: "Обзор (все объекты)",
    countLabel: (resCount, guestCount) => `${resCount} брон., ${guestCount} гостей`,
    addProperty: "Добавить объект",
    searchGuests: "Поиск гостей",
    searchGuestsTitle: "Поиск гостей (⌘K)",
    searchPlaceholder: "Имя, паспорт, страна…",
    closeSearch: "Закрыть поиск",
    searching: "Поиск...",
    noMatches: "Ничего не найдено",
    userMenu: "Меню пользователя",
    personalAccount: "Личный кабинет",
    theme: "Тема",
    language: "Язык",
    admin: "Админ",
    syncTasks: "Задачи синхронизации",
    refreshAll: "Обновить все календари",
    refreshingAll: "Обновляем…",
    refreshAllDone: "Календари обновлены",
  },
  de: {
    tabDashboard: "Übersicht",
    tabCalendar: "Kalender",
    tabCleaning: "Reinigung",
    tabReports: "Berichte",
    tabProperty: "Unterkunft",
    allProperties: "Alle Unterkünfte",
    dashboardAll: "Übersicht (alle Unterkünfte)",
    countLabel: (resCount, guestCount) =>
      `${resCount} ${resCount === 1 ? "Buchung" : "Buchungen"}, ${guestCount} ${guestCount === 1 ? "Gast" : "Gäste"}`,
    addProperty: "Unterkunft hinzufügen",
    searchGuests: "Gäste suchen",
    searchGuestsTitle: "Gäste suchen (⌘K)",
    searchPlaceholder: "Name, Pass, Land…",
    closeSearch: "Suche schließen",
    searching: "Suche läuft...",
    noMatches: "Keine Treffer",
    userMenu: "Benutzermenü",
    personalAccount: "Mein Konto",
    theme: "Design",
    language: "Sprache",
    admin: "Admin",
    syncTasks: "Sync-Aufgaben",
    refreshAll: "Alle Kalender aktualisieren",
    refreshingAll: "Wird aktualisiert…",
    refreshAllDone: "Kalender aktualisiert",
  },
  fr: {
    tabDashboard: "Tableau de bord",
    tabCalendar: "Calendrier",
    tabCleaning: "Ménage",
    tabReports: "Rapports",
    tabProperty: "Logement",
    allProperties: "Tous les logements",
    dashboardAll: "Tableau de bord (tous les logements)",
    countLabel: (resCount, guestCount) =>
      `${resCount} ${resCount === 1 ? "réservation" : "réservations"}, ${guestCount} ${guestCount === 1 ? "voyageur" : "voyageurs"}`,
    addProperty: "Ajouter un logement",
    searchGuests: "Rechercher des voyageurs",
    searchGuestsTitle: "Rechercher des voyageurs (⌘K)",
    searchPlaceholder: "Nom, passeport, pays…",
    closeSearch: "Fermer la recherche",
    searching: "Recherche…",
    noMatches: "Aucun résultat",
    userMenu: "Menu utilisateur",
    personalAccount: "Compte personnel",
    theme: "Thème",
    language: "Langue",
    admin: "Admin",
    syncTasks: "Tâches de synchronisation",
    refreshAll: "Actualiser tous les calendriers",
    refreshingAll: "Actualisation…",
    refreshAllDone: "Calendriers actualisés",
  },
  es: {
    tabDashboard: "Panel",
    tabCalendar: "Calendario",
    tabCleaning: "Limpieza",
    tabReports: "Informes",
    tabProperty: "Alojamiento",
    allProperties: "Todos los alojamientos",
    dashboardAll: "Panel (todos los alojamientos)",
    countLabel: (resCount, guestCount) =>
      `${resCount} ${resCount === 1 ? "reserva" : "reservas"}, ${guestCount} ${guestCount === 1 ? "huésped" : "huéspedes"}`,
    addProperty: "Añadir alojamiento",
    searchGuests: "Buscar huéspedes",
    searchGuestsTitle: "Buscar huéspedes (⌘K)",
    searchPlaceholder: "Nombre, pasaporte, país…",
    closeSearch: "Cerrar búsqueda",
    searching: "Buscando…",
    noMatches: "Sin resultados",
    userMenu: "Menú de usuario",
    personalAccount: "Cuenta personal",
    theme: "Tema",
    language: "Idioma",
    admin: "Admin",
    syncTasks: "Tareas de sincronización",
    refreshAll: "Actualizar todos los calendarios",
    refreshingAll: "Actualizando…",
    refreshAllDone: "Calendarios actualizados",
  },
};

export type AppView = "dashboard" | "calendar" | "cleaning" | "sync" | "guests" | "settings" | "tasks" | "reports" | "profile";

interface GuestSearchResult {
  guestId: number;
  fullName: string;
  country: string;
  passportNumber: string;
  reservationId: number;
  reservationName: string;
  checkIn: string;
  checkOut: string;
  propertyId: number;
  propertyName: string;
}

interface TopBarProps {
  properties: Property[];
  selectedPropertyId: number | null;
  activeView: AppView;
  onSelectProperty: (id: number | null) => void;
  onChangeView: (view: AppView) => void;
  // Atomic navigate that can change property + view together. Needed for
  // tab clicks like "Calendar" / "Cleaning" / "Settings" that require a
  // property — when none is selected we want to auto-pick the first one
  // AND land on the requested tab in a single nav, not two.
  onNavigate: (params: { property?: number | null; reservation?: number | null; view?: AppView }) => void;
  onOpenReservation?: (propertyId: number, reservationId: number) => void;
  username: string;
  userRole: string;
  onLogout: () => void;
}

export function TopBar({
  properties,
  selectedPropertyId,
  activeView,
  onSelectProperty,
  onChangeView,
  onNavigate,
  onOpenReservation,
  username,
  userRole,
  onLogout,
}: TopBarProps) {
  const isSuperAdmin = userRole === "superadmin";
  const { t, locale, setLocale } = useI18n();
  const c = COPY[locale];
  const [propDropdown, setPropDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  // "Refresh all calendars" — syncs every property the current user can
  // access (never other hosts'). idle → running → done (auto-resets).
  const [refreshState, setRefreshState] = useState<"idle" | "running" | "done">("idle");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GuestSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const propRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (propRef.current && !propRef.current.contains(e.target as Node)) setPropDropdown(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserDropdown(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 30);
      } else if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [searchOpen]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/guests/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults((data.results || []) as GuestSearchResult[]);
        }
      } catch {
        // aborted or network — ignore
      } finally {
        setSearchLoading(false);
      }
    }, 200);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [searchQuery]);

  const formatRange = (a: string, b: string) => {
    const f = (s: string) =>
      new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    return `${f(a)} — ${f(b)}`;
  };

  const handleResultClick = (r: GuestSearchResult) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    if (onOpenReservation) {
      onOpenReservation(r.propertyId, r.reservationId);
    }
  };

  // Property-required views — Calendar / Cleaning / Settings only make
  // sense in a property context. If user clicks one with no property
  // selected, auto-pick the first one in the same nav.
  const goToTab = (view: AppView) => {
    // Dashboard is the portfolio-wide view; clicking it always drops
    // the property scope so the user lands on the home/overview no
    // matter which property they were inside.
    if (view === "dashboard") {
      onNavigate({ property: null, reservation: null, view: "dashboard" });
      return;
    }
    // Calendar is the only tab that strictly requires a property —
    // there is no cross-property calendar view (a single grid can't
    // show 5 properties' bars meaningfully). Cleaning and Reports
    // are dual-mode: routing them with no property lands on the
    // global aggregate view, not a forced first-property pick.
    const requiresProperty = view === "calendar" || view === "sync";
    if (requiresProperty && !selectedPropertyId && properties.length > 0) {
      onNavigate({ property: properties[0].id, view });
    } else {
      onChangeView(view);
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // Refresh all of the current user's calendars. POST with no body —
  // the sync route scopes it to the caller's accessible properties.
  const handleRefreshAll = async () => {
    if (refreshState === "running") return;
    setRefreshState("running");
    try {
      await fetch("/api/calendar/sync", { method: "POST" });
      setRefreshState("done");
      setTimeout(() => setRefreshState("idle"), 3000);
    } catch {
      setRefreshState("idle");
    }
  };

  // All five tabs render at every scope so the header stays put.
  // Property-required tabs (Calendar, Property) auto-pick the first
  // property when clicked without a selection — see goToTab above.
  // The property selector to the left of the strip is the
  // canonical scope switcher; the tabs only switch *view* within
  // that scope, so they don't need to vanish based on selection.
  // Stripe / Linear / GitHub all use the same stable-header pattern.
  const tabs: { key: AppView; label: string; show: boolean }[] = [
    { key: "dashboard", label: c.tabDashboard, show: true },
    { key: "calendar", label: c.tabCalendar, show: true },
    { key: "cleaning", label: c.tabCleaning, show: true },
    { key: "reports", label: c.tabReports, show: true },
    { key: "sync", label: c.tabProperty, show: true },
  ];

  return (
    <header className="relative z-40 border-b border-[var(--line)] bg-[var(--bg-2)]">
      {/* Inner wrapper caps content width on ultra-wide screens (Airbnb
          pattern). The border-b + bg above stays full-width so the
          chrome still touches both edges of the viewport, but the
          actual logo / tabs / avatar stop spreading after ~1760px so
          they don't fly to the corners on a 4K monitor. */}
      <div className="mx-auto max-w-[1760px]">
      {/* Main bar — h-[72px] roughly matches Airbnb's host header, gives
          enough breathing room around the logo + nav cluster. */}
      <div className="relative flex items-center justify-between gap-3 h-[72px] px-3 sm:px-5">
        {/* LEFT: Logo + Property selector */}
        <div className="flex items-center gap-3 min-w-0 z-10 max-w-[55%] sm:max-w-none">
          <button
            onClick={() => onNavigate({ property: null, reservation: null, view: "dashboard" })}
            className="group flex items-center gap-2 shrink-0 rounded-xl text-[var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--m-accent)]/50"
            aria-label="Dashboard home"
          >
            {/* Brand mark: white house silhouette on coral pill, with
                three drifting smoke puffs from the chimney. Sized to
                match the marketing site header (h-9 / 22 px svg) so
                the brand reads identically across pages. Smoke is
                pure SVG <animate> so no framer-motion dep, no
                entrance shake / scale-rotate spring — the mark just
                paints in place on first render. */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--m-accent)] shadow-sm shadow-[var(--m-accent)]/30 transition-all duration-200 ease-out group-hover:scale-110 group-hover:shadow-md group-hover:shadow-[var(--m-accent)]/50 group-active:scale-90 group-active:duration-75">
              <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden="true">
                <g fill="white" stroke="white" strokeWidth="0.4" strokeLinejoin="round">
                  {/* Roof + walls outline as one shape */}
                  <path d="M3.4 11.6 L12 4.5 L20.6 11.6 L19 11.6 L19 19.5 L5 19.5 L5 11.6 Z" />
                  {/* Chimney */}
                  <rect x="15.6" y="6.2" width="1.7" height="3.4" rx="0.2" />
                </g>
                {/* Door + windows are punched out using the coral
                    bg colour so they read as openings on the white
                    silhouette, no extra fill needed. */}
                <g fill="var(--m-accent)">
                  <rect x="10.6" y="14" width="2.8" height="5.5" rx="0.4" />
                  <rect x="6.7" y="13" width="2.4" height="2.4" rx="0.3" />
                  <rect x="14.9" y="13" width="2.4" height="2.4" rx="0.3" />
                </g>
                {/* Smoke — three circles drifting up from the chimney,
                    staggered so the puffs feel continuous. Pure SVG
                    SMIL so it works with no JS. */}
                <g fill="white">
                  <circle cx="16.45" cy="5.5" r="0.6" opacity="0">
                    <animate attributeName="cy" values="5.5;3.2;1" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="cx" values="16.45;16.7;17.1" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="r" values="0.4;0.7;0.9" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.85;0" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="16.45" cy="5.5" r="0.6" opacity="0">
                    <animate attributeName="cy" values="5.5;3.2;1" dur="3s" begin="1s" repeatCount="indefinite" />
                    <animate attributeName="cx" values="16.45;16.2;15.9" dur="3s" begin="1s" repeatCount="indefinite" />
                    <animate attributeName="r" values="0.4;0.7;0.9" dur="3s" begin="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.7;0" dur="3s" begin="1s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="16.45" cy="5.5" r="0.6" opacity="0">
                    <animate attributeName="cy" values="5.5;3.2;1" dur="3s" begin="2s" repeatCount="indefinite" />
                    <animate attributeName="cx" values="16.45;16.6;17" dur="3s" begin="2s" repeatCount="indefinite" />
                    <animate attributeName="r" values="0.4;0.7;0.9" dur="3s" begin="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.6;0" dur="3s" begin="2s" repeatCount="indefinite" />
                  </circle>
                </g>
              </svg>
            </div>
            <span className="hidden sm:block text-[17px] font-semibold tracking-tight">RentTools</span>
          </button>

          {/* Property selector */}
          <div className="relative min-w-0" ref={propRef}>
            <button
              onClick={() => setPropDropdown(!propDropdown)}
              className="flex items-center gap-2 rounded-full border border-[var(--line-2)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--ink)] hover:border-[var(--ink)]/40 transition-colors min-w-0 max-w-[180px] sm:max-w-[220px]"
            >
              <span className="flex-1 text-left truncate">
                {selectedProperty ? selectedProperty.name : c.allProperties}
              </span>
              <svg className={`h-4 w-4 shrink-0 text-[var(--ink-4)] transition-transform ${propDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {propDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-[var(--line-2)] bg-[var(--bg-2)] shadow-xl shadow-black/20 z-50">
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      // Atomic navigate so the URL update is one
                      // commit, not two — the previous code did
                      // onSelectProperty(null) THEN onChangeView()
                      // which read selectedPropertyId from a stale
                      // closure and silently reverted the property
                      // change. That was the "doesn't work on first
                      // click" bug.
                      onNavigate({ property: null, reservation: null, view: "dashboard" });
                      setPropDropdown(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      !selectedPropertyId ? "bg-[var(--bg-3)] text-[var(--ink)] font-medium" : "text-[var(--ink-2)] hover:bg-[var(--bg-3)]"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    {c.dashboardAll}
                  </button>

                  <div className="my-1 h-px bg-[var(--line-2)]" />

                  {properties.map(p => {
                    const resCount = p.reservations.length;
                    const guestCount = p.reservations.reduce(
                      (sum, r) => sum + (r._count?.guests ?? 0),
                      0
                    );
                    const countLabel = c.countLabel(resCount, guestCount);
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          // Single atomic URL commit. Previously this
                          // ran onSelectProperty(p.id) and then a
                          // separate onChangeView("calendar"); the
                          // second navigate read selectedPropertyId
                          // from closure (still the OLD value) and
                          // overwrote the new property selection,
                          // which is why a fresh selection from the
                          // dashboard view used to need two clicks.
                          onNavigate({
                            property: p.id,
                            reservation: null,
                            view: activeView === "dashboard" ? "calendar" : activeView,
                          });
                          setPropDropdown(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          p.id === selectedPropertyId ? "bg-[var(--bg-3)] text-[var(--ink)]" : "text-[var(--ink-2)] hover:bg-[var(--bg-3)]"
                        }`}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--m-accent)]/10 text-[var(--m-accent)]">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12L12 3l9.75 9M4.5 9.75v9.75A1.5 1.5 0 006 21h3.75v-6h4.5v6H18a1.5 1.5 0 001.5-1.5V9.75" />
                          </svg>
                        </span>
                        <span className="flex-1 min-w-0 text-left">
                          <span className={`block truncate ${p.id === selectedPropertyId ? "font-medium" : ""}`}>{p.name}</span>
                          <span className="block truncate text-[11px] text-[var(--ink-4)]">{countLabel}</span>
                        </span>
                        {p.id === selectedPropertyId && (
                          <svg className="h-4 w-4 shrink-0 text-[var(--m-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    );
                  })}

                  <div className="my-1 h-px bg-[var(--line-2)]" />

                  {/* Adding a property is now a full page (with a
                      proper name + iCal feeds form), not a 1-input
                      inline prompt. The dropdown just routes there
                      so the entry stays as a one-click affordance. */}
                  <Link
                    href="/dashboard/add-property"
                    onClick={() => setPropDropdown(false)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--ink-4)] hover:bg-[var(--bg-3)] hover:text-[var(--ink-2)]"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    {c.addProperty}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Tabs (lg+ only). Absolute-centered like Airbnb so the
            left & right groups can size naturally without throwing off
            the centerline. pointer-events trick lets the wider invisible
            wrapper not eat clicks on logo/avatar. */}
        <nav className="absolute inset-x-0 top-0 bottom-0 mx-auto pointer-events-none hidden lg:flex items-center justify-center" aria-label="Primary">
          <div className="pointer-events-auto flex items-center">
            {tabs.filter(tab => tab.show).map(tab => (
              <NavTab
                key={tab.key}
                label={tab.label}
                active={activeView === tab.key}
                onClick={() => goToTab(tab.key)}
              />
            ))}
          </div>
        </nav>

        {/* RIGHT: Search + Avatar */}
        <div className="flex items-center gap-1 z-10 shrink-0">
          {onOpenReservation && (
            <div className="relative flex items-center" ref={searchRef}>
              {/* Search trigger: small icon button when collapsed; turns
                  into a width-animated input that slides leftward into
                  the header on click instead of dropping a popover from
                  the icon. The transition runs on width + opacity so it
                  feels like the input grew out of the icon. */}
              <button
                onClick={() => {
                  setSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 30);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-3)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)] transition-all ${
                  searchOpen ? "opacity-0 pointer-events-none -mr-9" : "opacity-100"
                }`}
                aria-label={c.searchGuests}
                title={c.searchGuestsTitle}
              >
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>

              <div
                className={`flex items-center overflow-hidden transition-[width,opacity] duration-300 ease-out ${
                  // 200px on mobile so the input + close button still
                  // fit on a 375px header next to the property selector
                  // and avatar; 280px from sm+ where the chrome has
                  // breathing room.
                  // min-w-0 + the matching min-w-0 on the inner wrapper
                  // and input below are what actually let `w-0`
                  // collapse to zero. Without them the input's CSS-
                  // default `min-width: auto` (resolved as min-content)
                  // forces the children to their intrinsic width even
                  // inside an overflow-hidden parent — `overflow-hidden`
                  // clips paint, NOT layout, so the children still push
                  // the document's scrollWidth past the viewport. That
                  // surfaced as horizontal scroll on every dashboard
                  // page at 375px (visible scrollbar on mobile screen,
                  // invisible offscreen tabs to the right of the
                  // expected layout).
                  searchOpen ? "w-[200px] opacity-100 sm:w-[280px]" : "w-0 opacity-0"
                } min-w-0`}
              >
                <div className="relative flex min-w-0 items-center w-full rounded-full border border-[var(--line-2)] bg-[var(--bg)] pl-3 pr-1 h-9">
                  <svg className="h-4 w-4 shrink-0 text-[var(--ink-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={c.searchPlaceholder}
                    className="ml-2 min-w-0 flex-1 bg-transparent text-sm text-[var(--ink)] placeholder-[var(--ink-4)] outline-none"
                  />
                  <button
                    onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                    aria-label={c.closeSearch}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--ink-4)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)]"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Results panel only renders once the user has typed
                  enough to query (>=2 chars). Below that the dropdown
                  is hidden entirely — no "type at least 2 characters"
                  hint cluttering the header on focus. */}
              {searchOpen && searchQuery.trim().length >= 2 && (
                <div className="absolute right-0 top-full z-50 mt-2 w-[20rem] rounded-xl border border-[var(--line-2)] bg-[var(--bg-2)] shadow-xl shadow-black/20 sm:w-[26rem]">
                  <div className="max-h-80 overflow-y-auto">
                    {searchLoading ? (
                      <p className="px-3 py-4 text-center text-[11px] text-[var(--ink-4)]">
                        {c.searching}
                      </p>
                    ) : searchResults.length === 0 ? (
                      <p className="px-3 py-4 text-center text-[11px] text-[var(--ink-4)]">
                        {c.noMatches}
                      </p>
                    ) : (
                      <ul className="py-1">
                        {searchResults.map((r) => (
                          <li key={r.guestId}>
                            <button
                              onClick={() => handleResultClick(r)}
                              className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-xs text-[var(--ink-2)] hover:bg-[var(--bg-3)]"
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="truncate font-medium text-[var(--ink)]">
                                  {r.fullName}
                                </span>
                                <span className="shrink-0 text-[10px] text-[var(--ink-4)]">
                                  {r.country}
                                </span>
                              </span>
                              <span className="flex items-center justify-between gap-2 text-[11px] text-[var(--ink-4)]">
                                <span className="truncate">
                                  {r.propertyName} · {r.reservationName}
                                </span>
                                <span className="shrink-0">
                                  {formatRange(r.checkIn, r.checkOut)}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User menu — Airbnb-style pill containing menu lines + avatar.
              All personal-cabinet items live here: theme, language, profile,
              personal settings, sync tasks, logout. */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserDropdown(!userDropdown)}
              className="flex items-center gap-2 rounded-full border border-[var(--line-2)] bg-[var(--bg)] py-1 pl-2.5 pr-1 text-[var(--ink-3)] hover:shadow-md hover:border-[var(--line-2)] transition-all"
              aria-label={c.userMenu}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <div className="h-7 w-7 rounded-full bg-[var(--ink-3)] flex items-center justify-center text-[11px] font-semibold text-white uppercase">
                {username[0]}
              </div>
            </button>

            {userDropdown && (
              <div className="absolute top-full right-0 mt-2 w-64 rounded-xl border border-[var(--line-2)] bg-[var(--bg-2)] shadow-xl shadow-black/20 z-50 p-1.5">
                {/* Identity */}
                <div className="px-3 pt-2 pb-2.5">
                  <p className="text-sm font-semibold text-[var(--ink)] truncate">{username}</p>
                  <p className="text-[11px] text-[var(--ink-4)]">
                    {c.personalAccount}
                  </p>
                </div>

                <div className="h-px bg-[var(--line)]" />

                {/* Theme row */}
                <div className="flex items-center justify-between px-3 py-2 text-sm text-[var(--ink-2)]">
                  <span>{c.theme}</span>
                  <ThemeToggle />
                </div>

                {/* Language row — render one button per supported locale.
                    Adding a 4th locale to SUPPORTED_LOCALES auto-renders
                    another button. Stacked (label above the buttons)
                    rather than side-by-side: with 5 locale buttons the
                    inline layout left no room for a longer label like
                    "Language" / "Sprache" and they crowded together. */}
                <div className="flex flex-col gap-1.5 px-3 py-2 text-sm text-[var(--ink-2)]">
                  <span>{c.language}</span>
                  <div className="flex items-center self-start rounded-md border border-[var(--line-2)] overflow-hidden">
                    {SUPPORTED_LOCALES.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setLocale(loc)}
                        className={`px-2 py-1 text-xs transition-colors ${locale === loc ? "bg-[var(--bg-3)] text-[var(--ink)]" : "text-[var(--ink-4)] hover:text-[var(--ink-2)]"}`}
                      >{loc.toUpperCase()}</button>
                    ))}
                  </div>
                </div>

                <div className="my-1 h-px bg-[var(--line)]" />

                {/* Profile is now a routed view, not a modal drawer, so it
                    feels like a real page (the user can deep-link, hit back,
                    and the page integrates with the rest of the dashboard
                    chrome). */}
                <button
                  onClick={() => { onChangeView("profile"); setUserDropdown(false); }}
                  className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                    activeView === "profile" ? "bg-[var(--bg-3)] text-[var(--ink)]" : "text-[var(--ink-2)] hover:bg-[var(--bg-3)]"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t("profile.title")}
                </button>

                {/* Admin — points at the new CMS-style admin shell at
                    /dashboard/admin (RT-25.9). The legacy ?view=settings
                    SettingsPanel surface is still reachable via direct
                    URL until the removal sweep ships. */}
                {isSuperAdmin && (
                  <Link
                    href="/dashboard/admin"
                    onClick={() => setUserDropdown(false)}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--bg-3)]"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5l9 4.5v6c0 5-3.5 9.5-9 11-5.5-1.5-9-6-9-11v-6l9-4.5z" />
                    </svg>
                    {c.admin}
                  </Link>
                )}

                {/* Sync tasks — now also superadmin-only since the page
                    exposes the cron URL + cross-property sync log, which
                    are operator-level concerns. */}
                {isSuperAdmin && (
                  <button
                    onClick={() => { onChangeView("tasks"); setUserDropdown(false); }}
                    className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                      activeView === "tasks" ? "bg-[var(--bg-3)] text-[var(--ink)]" : "text-[var(--ink-2)] hover:bg-[var(--bg-3)]"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {c.syncTasks}
                  </button>
                )}

                <div className="my-1 h-px bg-[var(--line)]" />

                {/* Refresh all calendars — syncs every property this
                    user can access. The cron handles the system-wide
                    pass; this is the on-demand version for the host. */}
                <button
                  onClick={handleRefreshAll}
                  disabled={refreshState === "running"}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--bg-3)] disabled:opacity-60"
                >
                  <svg
                    className={`h-4 w-4 ${refreshState === "running" ? "animate-spin" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  {refreshState === "running"
                    ? c.refreshingAll
                    : refreshState === "done"
                      ? c.refreshAllDone
                      : c.refreshAll}
                </button>

                <div className="my-1 h-px bg-[var(--line)]" />

                <button
                  onClick={() => { onLogout(); setUserDropdown(false); }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  {t("sidebar.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile / medium tabs row — visible whenever the centered
          desktop nav above is hidden. Same labels, horizontally
          scrollable. justify-start (was justify-center) so the user
          can SEE the leftmost tab as their starting point — centered
          tabs on a 375px viewport pushed Dashboard / Calendar partway
          off the left edge with no visible scroll affordance.
          scrollbar-none keeps the row tidy on browsers that show a
          permanent scrollbar; the fade-on-edge gradient hints at
          horizontal overflow without taking vertical space. */}
      <nav
        className="flex items-center gap-1 overflow-x-auto whitespace-nowrap px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-5 lg:hidden"
        aria-label="Primary mobile"
      >
        {tabs.filter(tab => tab.show).map(tab => (
          <NavTab
            key={tab.key}
            label={tab.label}
            active={activeView === tab.key}
            onClick={() => goToTab(tab.key)}
          />
        ))}
      </nav>
      </div>
    </header>
  );
}

function NavTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-3 text-sm font-medium transition-colors ${
        active ? "text-[var(--ink)]" : "text-[var(--ink-3)] hover:text-[var(--ink)]"
      }`}
    >
      {label}
      {active && (
        <span className="pointer-events-none absolute left-3 right-3 bottom-0 h-[2px] rounded-full bg-[var(--ink)]" />
      )}
    </button>
  );
}
