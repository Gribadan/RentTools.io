"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Property } from "@/lib/types";

export type AppView = "dashboard" | "calendar" | "cleaning" | "sync" | "guests" | "settings" | "tasks";

interface TopBarProps {
  properties: Property[];
  selectedPropertyId: number | null;
  activeView: AppView;
  onSelectProperty: (id: number | null) => void;
  onChangeView: (view: AppView) => void;
  onAddProperty: (name: string) => void;
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
  username,
  onLogout,
}: TopBarProps) {
  const { t, locale, setLocale } = useI18n();
  const [propDropdown, setPropDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [addingProp, setAddingProp] = useState(false);
  const [newPropName, setNewPropName] = useState("");
  const propRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (propRef.current && !propRef.current.contains(e.target as Node)) setPropDropdown(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
            <span className="text-sm font-semibold hidden sm:block">Rent Tool</span>
          </button>

          {/* Property selector */}
          <div className="relative" ref={propRef}>
            <button
              onClick={() => setPropDropdown(!propDropdown)}
              className="flex items-center gap-2 rounded-lg border border-[#333338] bg-[#111113] px-3 py-1.5 text-sm text-[#e8e8ec] hover:border-[#e8e8ec]/50 transition-colors min-w-[160px]"
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

                  {properties.map(p => (
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
                      <span className="h-2 w-2 rounded-full bg-[#34d399]" />
                      <span className="flex-1 text-left truncate">{p.name}</span>
                      <span className="text-xs text-[#71717a]">
                        {p.reservations.length}
                      </span>
                    </button>
                  ))}

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
          {/* Tasks/sync */}
          <button
            onClick={() => onChangeView("tasks")}
            className={`rounded-md p-2 transition-colors ${
              activeView === "tasks" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a] hover:bg-[#1e1e22] hover:text-[#d4d4d8]"
            }`}
            title={locale === "ru" ? "Задачи синхронизации" : "Sync tasks"}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Settings */}
          <button
            onClick={() => onChangeView("settings")}
            className={`rounded-md p-2 transition-colors ${
              activeView === "settings" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a] hover:bg-[#1e1e22] hover:text-[#d4d4d8]"
            }`}
            title={t("sidebar.settings")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Language */}
          <div className="flex items-center rounded-md border border-[#333338] overflow-hidden">
            <button
              onClick={() => setLocale("ru")}
              className={`px-2 py-1 text-xs transition-colors ${locale === "ru" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a] hover:text-[#d4d4d8]"}`}
            >RU</button>
            <button
              onClick={() => setLocale("en")}
              className={`px-2 py-1 text-xs transition-colors ${locale === "en" ? "bg-[#1e1e22] text-[#e8e8ec]" : "text-[#71717a] hover:text-[#d4d4d8]"}`}
            >EN</button>
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
          </div>
        </div>
      </div>

      {/* Tab bar (only when a property is selected) */}
      {selectedPropertyId && (
        <div className="flex items-center gap-1 px-4 -mb-px">
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
