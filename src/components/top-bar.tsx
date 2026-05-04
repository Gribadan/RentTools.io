"use client";

import { useState, useRef, useEffect } from "react";
import { ProfilePanel } from "@/components/profile-panel";
import { useI18n } from "@/lib/i18n/context";
import type { Property } from "@/lib/types";

export type AppView = "dashboard" | "calendar" | "cleaning" | "sync" | "guests" | "settings" | "tasks" | "reports";

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
  onOpenReservation?: (propertyId: number, reservationId: number) => void;
  username: string;
  onLogout: () => void;
}

export function TopBar({
  properties,
  selectedPropertyId,
  activeView,
  onSelectProperty,
  onChangeView,
  onAddProperty,
  onOpenReservation,
  username,
  onLogout,
}: TopBarProps) {
  const { t, locale, setLocale } = useI18n();
  const [propDropdown, setPropDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [addingProp, setAddingProp] = useState(false);
  const [newPropName, setNewPropName] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GuestSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const propRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (propRef.current && !propRef.current.contains(e.target as Node)) setPropDropdown(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserDropdown(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) setMobileMenu(false);
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

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const tabs: { key: AppView; label: string; icon: string }[] = [
    { key: "calendar", label: locale === "ru" ? "Календарь" : "Calendar", icon: "cal" },
    { key: "cleaning", label: locale === "ru" ? "Уборки" : "Cleaning", icon: "clean" },
    { key: "guests", label: locale === "ru" ? "Гости" : "Guests", icon: "guest" },
    { key: "sync", label: locale === "ru" ? "Настройки" : "Settings", icon: "settings" },
  ];

  return (
    <header className="border-b border-[#27272b] bg-[#18181b]">
      {/* Top row */}
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: logo + property selector */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <button
            onClick={() => { onSelectProperty(null); onChangeView("dashboard"); }}
            className="flex items-center gap-2 text-[#e8e8ec] hover:text-[#e8e8ec] transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111113]">
              <svg className="h-4 w-4 text-[#e8e8ec]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
              </svg>
            </div>
            <span className="text-sm font-semibold hidden sm:block">RentTools</span>
          </button>

          {/* Property selector */}
          <div className="relative" ref={propRef}>
            <button
              onClick={() => setPropDropdown(!propDropdown)}
              className="flex items-center gap-2 rounded-lg border border-[#333338] bg-[#111113] px-3 py-1.5 text-sm text-[#e8e8ec] hover:border-[#e8e8ec]/50 transition-colors min-w-[120px] sm:min-w-[160px] max-w-[180px] sm:max-w-none"
            >
              <span className="flex-1 text-left truncate">
                {selectedProperty ? selectedProperty.name : (locale === "ru" ? "Все объекты" : "All properties")}
              </span>
              <svg className={`h-4 w-4 text-[#71717a] transition-transform ${propDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {propDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 rounded-lg border border-[#333338] bg-[#18181b] shadow-xl shadow-black/40 z-50">
                <div className="p-1">
                  <button
                    onClick={() => { onSelectProperty(null); onChangeView("dashboard"); setPropDropdown(false); }}
                    className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                      !selectedPropertyId ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#d4d4d8] hover:bg-[#1e1e22]"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    {locale === "ru" ? "Обзор (все объекты)" : "Dashboard (all)"}
                  </button>

                  <div className="my-1 h-px bg-[#27272b]" />

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
                          p.id === selectedPropertyId ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#d4d4d8] hover:bg-[#1e1e22]"
                        }`}
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#34d399]" />
                        <span className="flex-1 min-w-0 text-left">
                          <span className="block truncate">{p.name}</span>
                          <span className="block truncate text-[10px] text-[#71717a]">{countLabel}</span>
                        </span>
                      </button>
                    );
                  })}

                  <div className="my-1 h-px bg-[#27272b]" />

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
                        className="h-7 flex-1 rounded border border-[#333338] bg-[#111113] px-2 text-xs text-[#e8e8ec] placeholder-[#71717a] outline-none focus:border-[#e8e8ec]"
                        autoFocus
                      />
                      <button type="submit" className="rounded bg-[#ff385c] px-2 text-xs text-white hover:bg-[#e0294d]">+</button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setAddingProp(true)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-[#71717a] hover:bg-[#1e1e22] hover:text-[#d4d4d8]"
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

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Guest search */}
          {onOpenReservation && (
            <div className="relative" ref={searchRef}>
              <button
                onClick={() => {
                  setSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 30);
                }}
                className="flex items-center gap-1.5 rounded-md border border-[#333338] bg-[#111113] px-2 py-1.5 text-xs text-[#a0a0a8] hover:border-[#e8e8ec]/50 hover:text-[#d4d4d8] transition-colors"
                title={locale === "ru" ? "Поиск гостей (⌘K)" : "Search guests (⌘K)"}
                aria-label={locale === "ru" ? "Поиск гостей" : "Search guests"}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <kbd className="hidden md:inline rounded bg-[#27272b] px-1 py-0.5 text-[10px] text-[#71717a]">⌘K</kbd>
              </button>

              {searchOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-[20rem] rounded-lg border border-[#333338] bg-[#18181b] shadow-xl shadow-black/40 sm:w-[26rem]">
                  <div className="border-b border-[#27272b] p-2">
                    <input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        locale === "ru"
                          ? "Имя, паспорт, страна..."
                          : "Name, passport, country..."
                      }
                      className="h-8 w-full rounded-md border border-[#333338] bg-[#111113] px-2 text-xs text-[#e8e8ec] placeholder-[#71717a] outline-none focus:border-[#e8e8ec]"
                    />
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {searchQuery.trim().length < 2 ? (
                      <p className="px-3 py-4 text-center text-[11px] text-[#71717a]">
                        {locale === "ru"
                          ? "Введите минимум 2 символа"
                          : "Type at least 2 characters"}
                      </p>
                    ) : searchLoading ? (
                      <p className="px-3 py-4 text-center text-[11px] text-[#71717a]">
                        {locale === "ru" ? "Поиск..." : "Searching..."}
                      </p>
                    ) : searchResults.length === 0 ? (
                      <p className="px-3 py-4 text-center text-[11px] text-[#71717a]">
                        {locale === "ru" ? "Ничего не найдено" : "No matches"}
                      </p>
                    ) : (
                      <ul className="py-1">
                        {searchResults.map((r) => (
                          <li key={r.guestId}>
                            <button
                              onClick={() => handleResultClick(r)}
                              className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-xs text-[#d4d4d8] hover:bg-[#1e1e22]"
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="truncate font-medium text-[#e8e8ec]">
                                  {r.fullName}
                                </span>
                                <span className="shrink-0 text-[10px] text-[#71717a]">
                                  {r.country}
                                </span>
                              </span>
                              <span className="flex items-center justify-between gap-2 text-[11px] text-[#71717a]">
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

          {/* Tasks/sync — desktop only */}
          <button
            onClick={() => onChangeView("tasks")}
            className={`hidden sm:block rounded-md p-2 transition-colors ${
              activeView === "tasks" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a] hover:bg-[#1e1e22] hover:text-[#d4d4d8]"
            }`}
            title={locale === "ru" ? "Задачи синхронизации" : "Sync tasks"}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Reports — desktop only */}
          <button
            onClick={() => onChangeView("reports")}
            className={`hidden sm:block rounded-md p-2 transition-colors ${
              activeView === "reports" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a] hover:bg-[#1e1e22] hover:text-[#d4d4d8]"
            }`}
            title={locale === "ru" ? "Отчёты" : "Reports"}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </button>

          {/* Settings — desktop only */}
          <button
            onClick={() => onChangeView("settings")}
            className={`hidden sm:block rounded-md p-2 transition-colors ${
              activeView === "settings" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a] hover:bg-[#1e1e22] hover:text-[#d4d4d8]"
            }`}
            title={t("sidebar.settings")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Language — desktop only */}
          <div className="hidden sm:flex items-center rounded-md border border-[#333338] overflow-hidden">
            <button
              onClick={() => setLocale("ru")}
              className={`px-2 py-1 text-xs transition-colors ${locale === "ru" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a] hover:text-[#d4d4d8]"}`}
            >RU</button>
            <button
              onClick={() => setLocale("en")}
              className={`px-2 py-1 text-xs transition-colors ${locale === "en" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a] hover:text-[#d4d4d8]"}`}
            >EN</button>
          </div>

          {/* Mobile hamburger menu */}
          <div className="relative sm:hidden" ref={mobileRef}>
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="rounded-md p-2 text-[#71717a] hover:bg-[#1e1e22] hover:text-[#d4d4d8] transition-colors"
              aria-label="Menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            {mobileMenu && (
              <div className="absolute top-full right-0 mt-1 w-56 rounded-lg border border-[#333338] bg-[#18181b] shadow-xl shadow-black/40 z-50 p-1">
                <button
                  onClick={() => { onChangeView("tasks"); setMobileMenu(false); }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    activeView === "tasks" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#d4d4d8] hover:bg-[#1e1e22]"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {locale === "ru" ? "Задачи" : "Tasks"}
                </button>
                <button
                  onClick={() => { onChangeView("reports"); setMobileMenu(false); }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    activeView === "reports" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#d4d4d8] hover:bg-[#1e1e22]"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                  {locale === "ru" ? "Отчёты" : "Reports"}
                </button>
                <button
                  onClick={() => { onChangeView("settings"); setMobileMenu(false); }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    activeView === "settings" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#d4d4d8] hover:bg-[#1e1e22]"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t("sidebar.settings")}
                </button>
                <div className="my-1 h-px bg-[#27272b]" />
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-[#71717a]">{locale === "ru" ? "Язык" : "Language"}</span>
                  <div className="flex items-center rounded-md border border-[#333338] overflow-hidden">
                    <button
                      onClick={() => setLocale("ru")}
                      className={`px-2 py-1 text-xs ${locale === "ru" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a]"}`}
                    >RU</button>
                    <button
                      onClick={() => setLocale("en")}
                      className={`px-2 py-1 text-xs ${locale === "en" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a]"}`}
                    >EN</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserDropdown(!userDropdown)}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-[#a0a0a8] hover:bg-[#1e1e22] hover:text-[#d4d4d8] transition-colors"
            >
              <div className="h-6 w-6 rounded-full bg-[#333338] flex items-center justify-center text-[10px] font-bold text-[#d4d4d8] uppercase">
                {username[0]}
              </div>
              <span className="hidden sm:block">{username}</span>
            </button>

            {userDropdown && (
              <div className="absolute top-full right-0 mt-1 w-40 rounded-lg border border-[#333338] bg-[#18181b] shadow-xl shadow-black/40 z-50 p-1">
                <button
                  onClick={() => { setProfileOpen(true); setUserDropdown(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#d4d4d8] hover:bg-[#1e1e22] transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t("profile.title")}
                </button>
                <button
                  onClick={() => { onLogout(); setUserDropdown(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  {t("sidebar.logout")}
                </button>
              </div>
            )}
            <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
          </div>
        </div>
      </div>

      {/* Tab bar (only when a property is selected) */}
      {selectedPropertyId && (
        <div className="flex items-center gap-1 px-4 -mb-px overflow-x-auto whitespace-nowrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onChangeView(tab.key)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                activeView === tab.key
                  ? "text-[#e8e8ec]"
                  : "text-[#71717a] hover:text-[#d4d4d8]"
              }`}
            >
              {tab.label}
              {activeView === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-[#ff385c]" />
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
