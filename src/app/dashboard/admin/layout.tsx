"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { useI18n } from "@/lib/i18n/context";

// RT-25.9 tick 1 — CMS admin shell skeleton. Sidebar + content pane.
// Sub-routes are added in subsequent ticks; for now only the admin
// home (`/dashboard/admin`) is wired. Other sidebar entries render as
// "coming soon" (muted, not clickable) so the visual structure is
// complete without 404ing out of the shell.

interface NavItem {
  label: { en: string; ru: string };
  href?: string;
  available?: boolean;
  // RT-25.9 tick 15 — hide entries non-superadmins can't use. The
  // underlying API already returns 403, so previously these items
  // rendered for any logged-in user but bounced to a permission notice
  // on click. Hiding them at the sidebar level matches what the user
  // can actually do.
  requiresSuperadmin?: boolean;
}

interface NavGroup {
  label: { en: string; ru: string };
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    label: { en: "Account", ru: "Аккаунт" },
    items: [
      { label: { en: "Profile", ru: "Профиль" }, href: "/dashboard/admin/account/profile" },
      { label: { en: "Security & 2FA", ru: "Безопасность" } },
      { label: { en: "Sessions", ru: "Сессии" } },
      { label: { en: "Language & theme", ru: "Язык и тема" }, href: "/dashboard/admin/account/preferences" },
      { label: { en: "Data export", ru: "Экспорт данных" }, href: "/dashboard/admin/account/export" },
    ],
  },
  {
    label: { en: "Workspace", ru: "Рабочее пространство" },
    items: [
      { label: { en: "Users & roles", ru: "Пользователи и роли" }, href: "/dashboard/admin/workspace/users" },
      { label: { en: "Site settings", ru: "Настройки сайта" }, href: "/dashboard/admin/workspace/site-settings", requiresSuperadmin: true },
      { label: { en: "Properties", ru: "Объекты" }, href: "/dashboard/admin/workspace/properties" },
      { label: { en: "Cleaner assignments", ru: "Уборщики" } },
      { label: { en: "Message templates", ru: "Шаблоны сообщений" } },
      { label: { en: "Audit log", ru: "Журнал" }, href: "/dashboard/admin/workspace/audit" },
    ],
  },
  {
    label: { en: "Integrations", ru: "Интеграции" },
    items: [
      { label: { en: "Calendar platforms", ru: "Платформы" }, href: "/dashboard/admin/integrations/platforms", requiresSuperadmin: true },
      { label: { en: "iCal links", ru: "iCal ссылки" }, href: "/dashboard/admin/integrations/ical-links" },
      { label: { en: "Feed access tokens", ru: "Токены доступа" }, href: "/dashboard/admin/integrations/feed-tokens" },
      { label: { en: "Gemini AI key", ru: "Gemini AI ключ" }, href: "/dashboard/admin/integrations/gemini" },
      { label: { en: "SEO overrides", ru: "SEO переопределения" }, href: "/dashboard/admin/integrations/seo", requiresSuperadmin: true },
    ],
  },
  {
    label: { en: "Operations", ru: "Эксплуатация" },
    items: [
      { label: { en: "Sync logs", ru: "Логи синхронизации" }, href: "/dashboard/admin/operations/sync-logs" },
      { label: { en: "Scheduled jobs", ru: "Задачи" } },
      { label: { en: "Status page", ru: "Статус" }, href: "/dashboard/admin/operations/status" },
    ],
  },
  {
    label: { en: "Content", ru: "Контент" },
    items: [
      { label: { en: "Blog posts", ru: "Статьи блога" }, requiresSuperadmin: true },
      { label: { en: "Blog comments", ru: "Комментарии блога" }, href: "/dashboard/admin/content/blog-comments", requiresSuperadmin: true },
      { label: { en: "Blog media", ru: "Медиа блога" }, href: "/dashboard/admin/content/blog-media", requiresSuperadmin: true },
      { label: { en: "Guest form templates", ru: "Шаблоны анкет" } },
    ],
  },
];

function AdminShell({ role, children }: { role: string; children: React.ReactNode }) {
  const { locale } = useI18n();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperadmin = role === "superadmin";
  // Filter out superadmin-only entries; drop a group entirely if it has
  // nothing visible left (currently no group is fully gated, but this
  // future-proofs the shell for content-only-superadmin sections).
  const visibleNav = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => isSuperadmin || !item.requiresSuperadmin),
  })).filter((group) => group.items.length > 0);

  // Close drawer on route change (mobile UX).
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="editorial flex h-screen flex-col overflow-hidden bg-[var(--bg)]">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--line)] bg-[var(--bg-2)] px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="-ml-1 flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--ink)] lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-[var(--ink-3)] transition-colors hover:text-[var(--ink)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="hidden sm:inline">{locale === "ru" ? "К кабинету" : "Back to dashboard"}</span>
          </Link>
        </div>
        <h1 className="text-base font-semibold text-[var(--ink)]">
          {locale === "ru" ? "Администрирование" : "Admin"}
        </h1>
        <div className="w-[40px] sm:w-[150px]" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — drawer on <lg, persistent on lg+ */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 top-14 z-30 bg-black/40 lg:hidden"
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 top-14 z-40 w-64 shrink-0 overflow-y-auto border-r border-[var(--line)] bg-[var(--bg-2)] transition-transform lg:static lg:top-0 lg:z-auto lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="space-y-5 p-4">
            {visibleNav.map((group) => (
              <div key={group.label.en}>
                <div className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                  {locale === "ru" ? group.label.ru : group.label.en}
                </div>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const label = locale === "ru" ? item.label.ru : item.label.en;
                    const active = item.href && pathname === item.href;
                    if (!item.href) {
                      return (
                        <li key={label}>
                          <span className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-[var(--ink-4)]">
                            <span>{label}</span>
                            <span className="text-[10px] uppercase tracking-wide text-[var(--ink-4)]/70">
                              {locale === "ru" ? "скоро" : "soon"}
                            </span>
                          </span>
                        </li>
                      );
                    }
                    return (
                      <li key={label}>
                        <Link
                          href={item.href}
                          className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                            active
                              ? "bg-[var(--bg-3)] text-[var(--ink)]"
                              : "text-[var(--ink-2)] hover:bg-[var(--bg-3)]/60 hover:text-[var(--ink)]"
                          }`}
                        >
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content pane */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8" style={{ scrollbarGutter: "stable" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <AuthGuard>
      {(user) => {
        // Cleaners have no admin surface. Bounce them to the cleaner-app
        // (dashboard already routes them there based on role).
        if (user.role === "cleaner") {
          if (typeof window !== "undefined") router.replace("/dashboard");
          return null;
        }
        return <AdminShell role={user.role}>{children}</AdminShell>;
      }}
    </AuthGuard>
  );
}
