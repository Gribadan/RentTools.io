"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

// RT-25.9 tick 6 — admin home upgrade. Replaces the tick-1 placeholder
// with (a) a tile grid of the migrated sub-routes so the admin shell
// has a useful landing surface, and (b) a "Recent activity" strip
// pulling the last 5 entries from /api/audit so the operator notices
// what changed since they last logged in. The audit endpoint is
// per-user (not a global feed); when the cross-user admin audit-log
// endpoint exists, this strip can be swapped in place.

interface AuditEntry {
  id: number;
  action: string;
  resourceType: string;
  resourceId: number;
  createdAt: string;
}

interface AuditResponse {
  entries?: AuditEntry[];
}

interface MeResponse {
  user?: { role: string } | null;
}

interface Tile {
  href: string;
  label: Record<Locale, string>;
  desc: Record<Locale, string>;
  // RT-25.9 tick 15 — match the sidebar gating in layout.tsx so the
  // admin home only surfaces tiles whose underlying API the user can
  // actually call.
  requiresSuperadmin?: boolean;
}

const TILES: ReadonlyArray<{
  group: Record<Locale, string>;
  items: ReadonlyArray<Tile>;
}> = [
  {
    group: { en: "Account", ru: "Аккаунт", de: "Konto", fr: "Compte" },
    items: [
      {
        href: "/dashboard/admin/account/profile",
        label: { en: "Profile", ru: "Профиль", de: "Profil", fr: "Profil" },
        desc: { en: "Username, password, sessions.", ru: "Логин, пароль, сессии.", de: "Benutzername, Passwort, Sitzungen.", fr: "Identifiant, mot de passe, sessions." },
      },
      {
        href: "/dashboard/admin/account/preferences",
        label: { en: "Language & theme", ru: "Язык и тема", de: "Sprache & Design", fr: "Langue et thème" },
        desc: { en: "Per-browser display preferences.", ru: "Настройки отображения в этом браузере.", de: "Anzeigeeinstellungen pro Browser.", fr: "Préférences d'affichage par navigateur." },
      },
      {
        href: "/dashboard/admin/account/export",
        label: { en: "Data export", ru: "Экспорт данных", de: "Datenexport", fr: "Export des données" },
        desc: { en: "Download a JSON backup of your data.", ru: "Скачать JSON резервную копию данных.", de: "JSON-Backup Ihrer Daten herunterladen.", fr: "Télécharger une sauvegarde JSON de vos données." },
      },
    ],
  },
  {
    group: { en: "Workspace", ru: "Рабочее пространство", de: "Arbeitsbereich", fr: "Espace de travail" },
    items: [
      {
        href: "/dashboard/admin/workspace/users",
        label: { en: "Users & roles", ru: "Пользователи и роли", de: "Benutzer & Rollen", fr: "Utilisateurs et rôles" },
        desc: { en: "Admins and managers of this instance.", ru: "Администраторы и менеджеры.", de: "Administratoren und Manager dieser Instanz.", fr: "Administrateurs et gestionnaires de cette instance." },
      },
      {
        href: "/dashboard/admin/workspace/properties",
        label: { en: "Properties", ru: "Объекты", de: "Objekte", fr: "Logements" },
        desc: {
          en: "Key-settings summary across every accessible property.",
          ru: "Сводка ключевых настроек по всем доступным объектам.",
          de: "Übersicht der wichtigsten Einstellungen über alle zugänglichen Objekte.",
          fr: "Synthèse des réglages clés pour chaque logement accessible.",
        },
      },
      {
        href: "/dashboard/admin/workspace/site-settings",
        label: { en: "Site settings", ru: "Настройки сайта", de: "Seiteneinstellungen", fr: "Paramètres du site" },
        desc: { en: "Public signup, quotas, landing announcement.", ru: "Регистрация, квоты, объявление.", de: "Öffentliche Registrierung, Kontingente, Startseiten-Hinweis.", fr: "Inscription publique, quotas, annonce d'accueil." },
        requiresSuperadmin: true,
      },
      {
        href: "/dashboard/admin/workspace/cleaners",
        label: { en: "Cleaners", ru: "Уборщики", de: "Reinigungskräfte", fr: "Agents d'entretien" },
        desc: {
          en: "Account-level cleaner pool. Per-property assignment lives on each property's Cleaning tab.",
          ru: "Пул уборщиков аккаунта. Назначение по объектам — на вкладке «Уборки» объекта.",
          de: "Pool der Reinigungskräfte auf Kontoebene. Zuweisung pro Objekt erfolgt im Reinigungs-Tab des Objekts.",
          fr: "Pool d'agents d'entretien du compte. L'affectation par logement se fait dans l'onglet Ménage du logement.",
        },
      },
      {
        href: "/dashboard/admin/workspace/message-templates",
        label: { en: "Message templates", ru: "Шаблоны сообщений", de: "Nachrichtenvorlagen", fr: "Modèles de messages" },
        desc: {
          en: "Cross-property overview of guest-message templates.",
          ru: "Сводка шаблонов сообщений по всем объектам.",
          de: "Objektübergreifende Übersicht der Gästenachrichten-Vorlagen.",
          fr: "Vue d'ensemble des modèles de messages voyageurs sur tous les logements.",
        },
      },
      {
        href: "/dashboard/admin/workspace/audit",
        label: { en: "Audit log", ru: "Журнал действий", de: "Aktionsprotokoll", fr: "Journal d'audit" },
        desc: { en: "Recent actions tied to your session.", ru: "Последние действия в вашей сессии.", de: "Letzte Aktionen in Ihrer Sitzung.", fr: "Actions récentes liées à votre session." },
      },
    ],
  },
  {
    group: { en: "Integrations", ru: "Интеграции", de: "Integrationen", fr: "Intégrations" },
    items: [
      {
        href: "/dashboard/admin/integrations/ical-links",
        label: { en: "iCal links", ru: "iCal ссылки", de: "iCal-Links", fr: "Liens iCal" },
        desc: {
          en: "All calendar feeds across your properties — status + last sync.",
          ru: "Все календарные фиды по объектам — статус и время последней синхронизации.",
          de: "Alle Kalender-Feeds Ihrer Objekte — Status und letzter Sync.",
          fr: "Tous les feeds de calendrier de vos logements — statut et dernier sync.",
        },
      },
      {
        href: "/dashboard/admin/integrations/feed-tokens",
        label: { en: "Feed access tokens", ru: "Токены доступа к фиду", de: "Feed-Zugriffstoken", fr: "Tokens d'accès au feed" },
        desc: {
          en: "Per-property: public or token-gated iCal feed URL.",
          ru: "По объектам: публичный или закрытый токеном URL фида.",
          de: "Pro Objekt: öffentliche oder per Token geschützte iCal-Feed-URL.",
          fr: "Par logement : URL du feed iCal publique ou protégée par token.",
        },
      },
      {
        href: "/dashboard/admin/integrations/gemini",
        label: { en: "Gemini AI key", ru: "Gemini AI ключ", de: "Gemini-AI-Schlüssel", fr: "Clé Gemini AI" },
        desc: { en: "API key for guest passport extraction.", ru: "API ключ для извлечения паспортов.", de: "API-Schlüssel für die Erkennung von Gäste-Pässen.", fr: "Clé API pour l'extraction des passeports voyageurs." },
      },
      {
        href: "/dashboard/admin/integrations/seo",
        label: { en: "SEO overrides", ru: "SEO переопределения", de: "SEO-Overrides", fr: "Overrides SEO" },
        desc: {
          en: "Override title, description, OG image, canonical per page.",
          ru: "Переопределить title, description, OG-картинку и canonical для страницы.",
          de: "Title, Description, OG-Bild und Canonical pro Seite überschreiben.",
          fr: "Override du title, description, image OG et canonical par page.",
        },
        requiresSuperadmin: true,
      },
      {
        href: "/dashboard/admin/integrations/platforms",
        label: { en: "Calendar platforms", ru: "Платформы (календарь)", de: "Kalenderplattformen", fr: "Plateformes (calendrier)" },
        desc: {
          en: "Edit colors, sort order, enable/disable. Add custom platforms.",
          ru: "Цвета, порядок, включение/отключение. Добавить пользовательские платформы.",
          de: "Farben, Sortierung, Aktivieren/Deaktivieren bearbeiten. Eigene Plattformen hinzufügen.",
          fr: "Modifier couleurs, ordre, activer/désactiver. Ajouter des plateformes personnalisées.",
        },
        requiresSuperadmin: true,
      },
    ],
  },
  {
    group: { en: "Operations", ru: "Эксплуатация", de: "Betrieb", fr: "Exploitation" },
    items: [
      {
        href: "/dashboard/admin/operations/sync-logs",
        label: { en: "Sync logs", ru: "Логи синхронизации", de: "Sync-Logs", fr: "Logs de sync" },
        desc: {
          en: "Chronological feed of sync events across all properties.",
          ru: "Хронологическая лента событий синхронизации по всем объектам.",
          de: "Chronologischer Feed der Sync-Ereignisse über alle Objekte.",
          fr: "Feed chronologique des événements de sync sur tous les logements.",
        },
      },
      {
        href: "/dashboard/admin/operations/scheduled-jobs",
        label: { en: "Scheduled jobs", ru: "Запланированные задачи", de: "Geplante Aufgaben", fr: "Tâches planifiées" },
        desc: {
          en: "Cron jobs running on the host — schedule + description.",
          ru: "Задачи cron на сервере — расписание и описание.",
          de: "Cron-Jobs auf dem Server — Zeitplan und Beschreibung.",
          fr: "Tâches cron exécutées sur le serveur — planning et description.",
        },
      },
      {
        href: "/dashboard/admin/operations/status",
        label: { en: "Status page", ru: "Статус", de: "Statusseite", fr: "Page de statut" },
        desc: { en: "Internal health endpoints for spot checks.", ru: "Внутренние эндпоинты здоровья для проверки.", de: "Interne Health-Endpoints für Stichproben.", fr: "Endpoints de santé internes pour vérifications ponctuelles." },
      },
    ],
  },
  {
    group: { en: "Content", ru: "Контент", de: "Inhalte", fr: "Contenu" },
    items: [
      {
        href: "/dashboard/admin/content/blog-posts",
        label: { en: "Blog posts", ru: "Статьи блога", de: "Blogbeiträge", fr: "Articles de blog" },
        desc: {
          en: "List, filter, sort, bulk publish or archive. Edit body in the post editor.",
          ru: "Список, фильтры, сортировка, массовая публикация или архив. Тело редактируется в редакторе статьи.",
          de: "Liste, Filter, Sortierung, Massenveröffentlichung oder Archivierung. Inhalt im Beitragseditor bearbeiten.",
          fr: "Liste, filtres, tri, publication ou archivage en masse. Le contenu se modifie dans l'éditeur d'article.",
        },
        requiresSuperadmin: true,
      },
      {
        href: "/dashboard/admin/content/blog-comments",
        label: { en: "Blog comments", ru: "Комментарии блога", de: "Blog-Kommentare", fr: "Commentaires du blog" },
        desc: {
          en: "Moderate reader comments — hide, restore, soft-delete.",
          ru: "Модерация комментариев — скрыть, восстановить, удалить.",
          de: "Leserkommentare moderieren — ausblenden, wiederherstellen, weich löschen.",
          fr: "Modérer les commentaires des lecteurs — masquer, restaurer, supprimer.",
        },
        requiresSuperadmin: true,
      },
      {
        href: "/dashboard/admin/content/blog-tags",
        label: { en: "Blog tags", ru: "Теги блога", de: "Blog-Tags", fr: "Tags du blog" },
        desc: {
          en: "Rename, delete, or merge tags. Slug edits rewrite all referencing posts.",
          ru: "Переименование, удаление и объединение тегов. Изменение слага переписывает все статьи.",
          de: "Tags umbenennen, löschen oder zusammenführen. Slug-Änderungen aktualisieren alle verweisenden Beiträge.",
          fr: "Renommer, supprimer ou fusionner des tags. La modification du slug réécrit tous les articles concernés.",
        },
        requiresSuperadmin: true,
      },
      {
        href: "/dashboard/admin/content/blog-media",
        label: { en: "Blog media", ru: "Медиа блога", de: "Blog-Medien", fr: "Médias du blog" },
        desc: {
          en: "OG images referenced by blog posts. Read-only until R2 / S3 ships.",
          ru: "OG-картинки статей блога. Только просмотр, пока не подключено R2 / S3.",
          de: "Von Blogbeiträgen referenzierte OG-Bilder. Nur lesend, bis R2 / S3 verfügbar ist.",
          fr: "Images OG référencées par les articles. Lecture seule tant que R2 / S3 n'est pas en place.",
        },
        requiresSuperadmin: true,
      },
      {
        href: "/dashboard/admin/content/guest-forms",
        label: { en: "Guest form templates", ru: "Шаблоны анкет гостей", de: "Gästeformular-Vorlagen", fr: "Modèles de formulaires voyageurs" },
        desc: {
          en: "Pre-arrival forms across properties — field count + submission count.",
          ru: "Анкеты заезда по объектам — количество полей и ответов.",
          de: "Anreiseformulare über alle Objekte — Anzahl Felder und Einreichungen.",
          fr: "Formulaires pré-arrivée sur tous les logements — nombre de champs et de réponses.",
        },
      },
    ],
  },
];

interface CopyShape {
  justNow: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  daysAgo: (n: number) => string;
  dateLocale: string;
  title: string;
  subtitle: string;
  recentActivity: string;
  loading: string;
  noActivity: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    justNow: "just now",
    minutesAgo: (n) => `${n}m ago`,
    hoursAgo: (n) => `${n}h ago`,
    daysAgo: (n) => `${n}d ago`,
    dateLocale: "en-GB",
    title: "Admin",
    subtitle: "Consolidated settings home. More sections light up as they migrate from the legacy long-scroll settings page.",
    recentActivity: "Recent activity",
    loading: "Loading...",
    noActivity: "No activity yet.",
  },
  ru: {
    justNow: "только что",
    minutesAgo: (n) => `${n} мин назад`,
    hoursAgo: (n) => `${n} ч назад`,
    daysAgo: (n) => `${n} д назад`,
    dateLocale: "ru-RU",
    title: "Администрирование",
    subtitle: "Все настройки в одном месте. Разделы появляются по мере переноса со старой страницы настроек.",
    recentActivity: "Последние действия",
    loading: "Загрузка...",
    noActivity: "Действий пока нет.",
  },
  de: {
    justNow: "gerade eben",
    minutesAgo: (n) => `vor ${n} Min.`,
    hoursAgo: (n) => `vor ${n} Std.`,
    daysAgo: (n) => `vor ${n} T.`,
    dateLocale: "de-DE",
    title: "Verwaltung",
    subtitle: "Alle Einstellungen an einem Ort. Weitere Bereiche kommen hinzu, sobald sie aus der alten Einstellungsseite migriert sind.",
    recentActivity: "Letzte Aktivität",
    loading: "Wird geladen...",
    noActivity: "Noch keine Aktivität.",
  },
  fr: {
    justNow: "à l'instant",
    minutesAgo: (n) => `il y a ${n} min`,
    hoursAgo: (n) => `il y a ${n} h`,
    daysAgo: (n) => `il y a ${n} j`,
    dateLocale: "fr-FR",
    title: "Administration",
    subtitle: "Tous les paramètres au même endroit. D'autres sections s'ajoutent au fur et à mesure de leur migration depuis l'ancienne page de réglages.",
    recentActivity: "Activité récente",
    loading: "Chargement...",
    noActivity: "Aucune activité pour l'instant.",
  },
};

export default function AdminHomePage() {
  const { locale } = useI18n();
  const t = COPY[locale];
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? (r.json() as Promise<MeResponse>) : null))
      .then((data) => setRole(data?.user?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => (r.ok ? (r.json() as Promise<AuditResponse>) : null))
      .then((data) => {
        const rows = Array.isArray(data?.entries) ? data!.entries! : [];
        setEntries(rows.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setAuditLoaded(true));
  }, []);

  const isSuperadmin = role === "superadmin";
  const visibleTiles = TILES.map((group) => ({
    ...group,
    items: group.items.filter((tile) => isSuperadmin || !tile.requiresSuperadmin),
  })).filter((group) => group.items.length > 0);

  const formatRelative = (iso: string): string => {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMin = Math.floor((now - then) / 60000);
    if (diffMin < 1) return t.justNow;
    if (diffMin < 60) return t.minutesAgo(diffMin);
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return t.hoursAgo(diffHr);
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return t.daysAgo(diffDay);
    return new Date(iso).toLocaleDateString(t.dateLocale, {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {t.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {t.subtitle}
        </p>
      </div>

      {/* Tile grid */}
      {visibleTiles.map((group) => (
        <section key={group.group.en} className="space-y-3">
          <h3 className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
            {group.group[locale]}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4 transition-all hover:border-[var(--line-2)] hover:bg-[var(--bg-3)]"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[var(--ink)]">
                    {item.label[locale]}
                  </h4>
                  <svg className="h-4 w-4 text-[var(--ink-4)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
                <p className="mt-1.5 text-xs text-[var(--ink-4)]">
                  {item.desc[locale]}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* Recent activity strip */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
          {t.recentActivity}
        </h3>
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-2)]">
          {!auditLoaded ? (
            <div className="px-4 py-5 text-sm text-[var(--ink-4)]">
              {t.loading}
            </div>
          ) : entries.length === 0 ? (
            <div className="px-4 py-5 text-sm text-[var(--ink-4)]">
              {t.noActivity}
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line)]/50">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="inline-flex shrink-0 rounded bg-[var(--bg-3)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-3)]">
                    {e.action}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[var(--ink-2)]">
                    {e.resourceType}
                    <span className="text-[var(--ink-4)]"> #{e.resourceId}</span>
                  </span>
                  <span className="shrink-0 text-xs text-[var(--ink-4)]">
                    {formatRelative(e.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
