"use client";

import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n/context";
import type { Property } from "@/lib/types";

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
  onAddProperty: (name: string) => void;
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
  onAddProperty,
  onNavigate,
  onOpenReservation,
  username,
  userRole,
  onLogout,
}: TopBarProps) {
  const isSuperAdmin = userRole === "superadmin";
  const { t, locale, setLocale } = useI18n();
  const [propDropdown, setPropDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [addingProp, setAddingProp] = useState(false);
  const [newPropName, setNewPropName] = useState("");
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
    const requiresProperty = view === "calendar" || view === "cleaning" || view === "sync";
    if (requiresProperty && !selectedPropertyId && properties.length > 0) {
      onNavigate({ property: properties[0].id, view });
    } else {
      onChangeView(view);
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const tabs: { key: AppView; label: string; show: boolean }[] = [
    { key: "calendar", label: locale === "ru" ? "Календарь" : "Calendar", show: true },
    { key: "cleaning", label: locale === "ru" ? "Уборки" : "Cleaning", show: true },
    { key: "reports", label: locale === "ru" ? "Отчёты" : "Reports", show: true },
    { key: "sync", label: locale === "ru" ? "Объект" : "Property", show: !!selectedPropertyId },
  ];

  return (
    <header className="border-b border-[var(--line)] bg-[var(--bg-2)]">
      {/* Main bar */}
      <div className="relative flex items-center justify-between gap-3 h-16 px-3 sm:px-5">
        {/* LEFT: Logo + Property selector */}
        <div className="flex items-center gap-3 min-w-0 z-10 max-w-[55%] sm:max-w-none">
          <button
            onClick={() => { onSelectProperty(null); onChangeView("dashboard"); }}
            className="flex items-center gap-2 shrink-0 text-[var(--ink)] hover:opacity-80 transition-opacity"
            aria-label="Dashboard home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--m-accent)]">
              <svg viewBox="0 0 32 32" className="h-4 w-4 text-white" aria-hidden="true">
                <rect x="6" y="9" width="20" height="3" rx="1.5" fill="currentColor" />
                <rect x="6" y="15" width="14" height="3" rx="1.5" fill="currentColor" opacity="0.85" />
                <rect x="6" y="21" width="9" height="3" rx="1.5" fill="currentColor" opacity="0.7" />
              </svg>
            </div>
            <span className="hidden sm:block text-sm font-semibold tracking-tight">RentTools</span>
          </button>

          {/* Property selector */}
          <div className="relative min-w-0" ref={propRef}>
            <button
              onClick={() => setPropDropdown(!propDropdown)}
              className="flex items-center gap-2 rounded-full border border-[var(--line-2)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--ink)] hover:border-[var(--ink)]/40 transition-colors min-w-0 max-w-[180px] sm:max-w-[220px]"
            >
              <span className="flex-1 text-left truncate">
                {selectedProperty ? selectedProperty.name : (locale === "ru" ? "Все объекты" : "All properties")}
              </span>
              <svg className={`h-4 w-4 shrink-0 text-[var(--ink-4)] transition-transform ${propDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {propDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-[var(--line-2)] bg-[var(--bg-2)] shadow-xl shadow-black/20 z-50">
                <div className="p-1.5">
                  <button
                    onClick={() => { onSelectProperty(null); onChangeView("dashboard"); setPropDropdown(false); }}
                    className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                      !selectedPropertyId ? "bg-[var(--bg-3)] text-[var(--ink)]" : "text-[var(--ink-2)] hover:bg-[var(--bg-3)]"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    {locale === "ru" ? "Обзор (все объекты)" : "Dashboard (all)"}
                  </button>

                  <div className="my-1 h-px bg-[var(--line-2)]" />

                  {properties.map(p => {
                    const resCount = p.reservations.length;
                    const guestCount = p.reservations.reduce(
                      (sum, r) => sum + (r._count?.guests ?? 0),
                      0
                    );
                    const countLabel = locale === "ru"
                      ? `${resCount} брон., ${guestCount} гостей`
                      : `${resCount} ${resCount === 1 ? "reservation" : "reservations"}, ${guestCount} ${guestCount === 1 ? "guest" : "guests"}`;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProperty(p.id);
                          if (activeView === "dashboard") onChangeView("calendar");
                          setPropDropdown(false);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                          p.id === selectedPropertyId ? "bg-[var(--bg-3)] text-[var(--ink)]" : "text-[var(--ink-2)] hover:bg-[var(--bg-3)]"
                        }`}
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                        <span className="flex-1 min-w-0 text-left">
                          <span className="block truncate">{p.name}</span>
                          <span className="block truncate text-[10px] text-[var(--ink-4)]">{countLabel}</span>
                        </span>
                      </button>
                    );
                  })}

                  <div className="my-1 h-px bg-[var(--line-2)]" />

                  {addingProp ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (newPropName.trim()) {
                          onAddProperty(newPropName.trim());
                          setNewPropName("");
                          setAddingProp(false);
                        }
                      }}
                      className="flex gap-1.5 px-2 py-1.5"
                    >
                      <input
                        value={newPropName}
                        onChange={(e) => setNewPropName(e.target.value)}
                        placeholder={t("sidebar.propertyPlaceholder")}
                        className="h-7 flex-1 rounded border border-[var(--line-2)] bg-[var(--bg)] px-2 text-xs text-[var(--ink)] placeholder-[var(--ink-4)] outline-none focus:border-[var(--ink)]"
                        autoFocus
                      />
                      <button type="submit" className="rounded bg-[var(--m-accent)] px-2 text-xs text-white hover:bg-[var(--m-accent-2)]">+</button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setAddingProp(true)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--ink-4)] hover:bg-[var(--bg-3)] hover:text-[var(--ink-2)]"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      {locale === "ru" ? "Добавить объект" : "Add property"}
                    </button>
                  )}
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
                aria-label={locale === "ru" ? "Поиск гостей" : "Search guests"}
                title={locale === "ru" ? "Поиск гостей (⌘K)" : "Search guests (⌘K)"}
              >
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>

              <div
                className={`flex items-center overflow-hidden transition-[width,opacity] duration-300 ease-out ${
                  searchOpen ? "w-[280px] opacity-100" : "w-0 opacity-0"
                }`}
              >
                <div className="relative flex items-center w-full rounded-full border border-[var(--line-2)] bg-[var(--bg)] pl-3 pr-1 h-9">
                  <svg className="h-4 w-4 shrink-0 text-[var(--ink-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      locale === "ru"
                        ? "Имя, паспорт, страна…"
                        : "Name, passport, country…"
                    }
                    className="ml-2 flex-1 bg-transparent text-sm text-[var(--ink)] placeholder-[var(--ink-4)] outline-none"
                  />
                  <button
                    onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                    aria-label={locale === "ru" ? "Закрыть поиск" : "Close search"}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--ink-4)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)]"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {searchOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-[20rem] rounded-xl border border-[var(--line-2)] bg-[var(--bg-2)] shadow-xl shadow-black/20 sm:w-[26rem]">
                  <div className="max-h-80 overflow-y-auto">
                    {searchQuery.trim().length < 2 ? (
                      <p className="px-3 py-4 text-center text-[11px] text-[var(--ink-4)]">
                        {locale === "ru"
                          ? "Введите минимум 2 символа"
                          : "Type at least 2 characters"}
                      </p>
                    ) : searchLoading ? (
                      <p className="px-3 py-4 text-center text-[11px] text-[var(--ink-4)]">
                        {locale === "ru" ? "Поиск..." : "Searching..."}
                      </p>
                    ) : searchResults.length === 0 ? (
                      <p className="px-3 py-4 text-center text-[11px] text-[var(--ink-4)]">
                        {locale === "ru" ? "Ничего не найдено" : "No matches"}
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
              aria-label={locale === "ru" ? "Меню пользователя" : "User menu"}
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
                    {locale === "ru" ? "Личный кабинет" : "Personal account"}
                  </p>
                </div>

                <div className="h-px bg-[var(--line)]" />

                {/* Theme row */}
                <div className="flex items-center justify-between px-3 py-2 text-sm text-[var(--ink-2)]">
                  <span>{locale === "ru" ? "Тема" : "Theme"}</span>
                  <ThemeToggle />
                </div>

                {/* Language row */}
                <div className="flex items-center justify-between px-3 py-2 text-sm text-[var(--ink-2)]">
                  <span>{locale === "ru" ? "Язык" : "Language"}</span>
                  <div className="flex items-center rounded-md border border-[var(--line-2)] overflow-hidden">
                    <button
                      onClick={() => setLocale("ru")}
                      className={`px-2 py-1 text-xs transition-colors ${locale === "ru" ? "bg-[var(--bg-3)] text-[var(--ink)]" : "text-[var(--ink-4)] hover:text-[var(--ink-2)]"}`}
                    >RU</button>
                    <button
                      onClick={() => setLocale("en")}
                      className={`px-2 py-1 text-xs transition-colors ${locale === "en" ? "bg-[var(--bg-3)] text-[var(--ink)]" : "text-[var(--ink-4)] hover:text-[var(--ink-2)]"}`}
                    >EN</button>
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

                {/* Admin — was "Account settings", but the page is the
                    superadmin user-management + Gemini-key + AdminPanel
                    surface, so we hide it from non-admins entirely and
                    rename it to match what it actually is. */}
                {isSuperAdmin && (
                  <button
                    onClick={() => { onChangeView("settings"); setUserDropdown(false); }}
                    className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                      activeView === "settings" ? "bg-[var(--bg-3)] text-[var(--ink)]" : "text-[var(--ink-2)] hover:bg-[var(--bg-3)]"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5l9 4.5v6c0 5-3.5 9.5-9 11-5.5-1.5-9-6-9-11v-6l9-4.5z" />
                    </svg>
                    {locale === "ru" ? "Админ" : "Admin"}
                  </button>
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
                    {locale === "ru" ? "Задачи синхронизации" : "Sync tasks"}
                  </button>
                )}

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
          desktop nav above is hidden. Same labels, scrollable. */}
      <nav className="lg:hidden flex items-center justify-center gap-1 px-3 sm:px-5 overflow-x-auto whitespace-nowrap" aria-label="Primary mobile">
        {tabs.filter(tab => tab.show).map(tab => (
          <NavTab
            key={tab.key}
            label={tab.label}
            active={activeView === tab.key}
            onClick={() => goToTab(tab.key)}
          />
        ))}
      </nav>
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
