"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

// RT-25.9 tick 27 — Scheduled jobs sub-route at
// /dashboard/admin/operations/scheduled-jobs. Read-only reference of
// the cron jobs configured on the droplet (deploy/cron/rent-tool.cron).
// These are infra-level — they run from crontab on the host, not from
// the app — so the page is documentation, not control. Calendar sync
// is the one job whose history we DO surface (per-event SyncLog rows
// at /admin/operations/sync-logs, tick 17) so its row deep-links there;
// the other three (DB backup, resource check, restore drill) write to
// log files on the droplet and are observable only via journalctl on
// the host. The list mirrors deploy/cron/rent-tool.cron — keep in sync
// when that file changes.

interface ScheduledJob {
  id: string;
  name: Record<Locale, string>;
  schedule: string;
  schedulePretty: Record<Locale, string>;
  description: Record<Locale, string>;
  link?: { href: string; label: Record<Locale, string> };
}

const JOBS: ReadonlyArray<ScheduledJob> = [
  {
    id: "calendar-sync",
    name: { en: "Calendar sync", ru: "Синхронизация календарей", de: "Kalender-Sync", fr: "Sync des calendriers", es: "Sync de calendarios" },
    schedule: "*/10 * * * *",
    schedulePretty: { en: "Every 10 minutes", ru: "Каждые 10 минут", de: "Alle 10 Minuten", fr: "Toutes les 10 minutes", es: "Cada 10 minutos" },
    description: {
      en: "Pulls every CalendarLink's iCal feed, writes events into CalendarEvent, records the result into SyncLog.",
      ru: "Загружает iCal фиды по каждой CalendarLink, пишет события в CalendarEvent, журнал в SyncLog.",
      de: "Lädt den iCal-Feed jeder CalendarLink, schreibt Ereignisse in CalendarEvent und protokolliert das Ergebnis in SyncLog.",
      fr: "Récupère le feed iCal de chaque CalendarLink, écrit les événements dans CalendarEvent et journalise le résultat dans SyncLog.",
      es: "Descarga el feed iCal de cada CalendarLink, escribe los eventos en CalendarEvent y registra el resultado en SyncLog.",
    },
    link: {
      href: "/dashboard/admin/operations/sync-logs",
      label: { en: "View sync logs", ru: "Логи синхронизации", de: "Sync-Logs anzeigen", fr: "Voir les logs de sync", es: "Ver logs de sync" },
    },
  },
  {
    id: "db-backup",
    name: { en: "SQLite backup", ru: "Резервная копия SQLite", de: "SQLite-Backup", fr: "Sauvegarde SQLite", es: "Copia de seguridad SQLite" },
    schedule: "15 3 * * *",
    schedulePretty: { en: "Daily at 03:15 UTC", ru: "Ежедневно в 03:15 UTC", de: "Täglich um 03:15 UTC", fr: "Chaque jour à 03h15 UTC", es: "Diaria a las 03:15 UTC" },
    description: {
      en: "Snapshot of data/prod.db with tiered retention (14 daily / 8 weekly / 6 monthly).",
      ru: "Снимок data/prod.db с многоуровневым хранением (14 дн / 8 нед / 6 мес).",
      de: "Snapshot von data/prod.db mit gestaffelter Aufbewahrung (14 täglich / 8 wöchentlich / 6 monatlich).",
      fr: "Snapshot de data/prod.db avec rétention par paliers (14 quotidiens / 8 hebdomadaires / 6 mensuels).",
      es: "Snapshot de data/prod.db con retención por niveles (14 diarios / 8 semanales / 6 mensuales).",
    },
  },
  {
    id: "resource-check",
    name: { en: "Resource check", ru: "Проверка ресурсов", de: "Ressourcenprüfung", fr: "Vérification des ressources", es: "Comprobación de recursos" },
    schedule: "5 * * * *",
    schedulePretty: { en: "Hourly at :05", ru: "Каждый час в :05", de: "Stündlich um :05", fr: "Chaque heure à :05", es: "Cada hora a las :05" },
    description: {
      en: "Alerts on RAM or disk usage above the configured warning thresholds. Posts to Telegram or webhook.",
      ru: "Уведомляет при превышении пороговых значений RAM или диска. Отправляет в Telegram или webhook.",
      de: "Warnt, wenn RAM- oder Festplattennutzung die konfigurierten Schwellen übersteigen. Sendet an Telegram oder Webhook.",
      fr: "Alerte lorsque l'usage RAM ou disque dépasse les seuils configurés. Envoie sur Telegram ou webhook.",
      es: "Avisa cuando el uso de RAM o disco supera los umbrales configurados. Envía a Telegram o a un webhook.",
    },
  },
  {
    id: "restore-drill",
    name: { en: "Backup restore drill", ru: "Проверка восстановления", de: "Backup-Restore-Test", fr: "Test de restauration", es: "Simulacro de restauración" },
    schedule: "30 4 1 * *",
    schedulePretty: { en: "Monthly on the 1st at 04:30 UTC", ru: "1-го числа в 04:30 UTC", de: "Monatlich am 1. um 04:30 UTC", fr: "Le 1er de chaque mois à 04h30 UTC", es: "El día 1 de cada mes a las 04:30 UTC" },
    description: {
      en: "Restores the latest monthly snapshot into a temp DB and runs sanity queries. Proves backups are usable.",
      ru: "Восстанавливает последний месячный снимок во временную БД и проверяет запросами. Подтверждает, что резервная копия рабочая.",
      de: "Stellt den letzten Monats-Snapshot in einer temporären DB wieder her und führt Plausibilitätsabfragen aus. Belegt, dass Backups verwendbar sind.",
      fr: "Restaure le dernier snapshot mensuel dans une base temporaire et lance des requêtes de contrôle. Prouve que les sauvegardes sont exploitables.",
      es: "Restaura el último snapshot mensual en una base de datos temporal y ejecuta consultas de comprobación. Demuestra que las copias son utilizables.",
    },
  },
];

interface CopyShape {
  title: string;
  subtitle: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "Scheduled jobs",
    subtitle: "Cron jobs configured on the host (deploy/cron/rent-tool.cron). Controlled from crontab on the droplet — this page is reference only. Calendar sync history is available on its own page.",
  },
  ru: {
    title: "Запланированные задачи",
    subtitle: "Задачи cron, настроенные на сервере (deploy/cron/rent-tool.cron). Управляются из crontab на хосте — здесь только справочник. История синхронизации календарей доступна на отдельной странице.",
  },
  de: {
    title: "Geplante Aufgaben",
    subtitle: "Cron-Jobs, die auf dem Server konfiguriert sind (deploy/cron/rent-tool.cron). Werden über crontab auf dem Droplet gesteuert — diese Seite dient nur zur Referenz. Die Kalender-Sync-Historie ist auf einer eigenen Seite verfügbar.",
  },
  fr: {
    title: "Tâches planifiées",
    subtitle: "Tâches cron configurées sur l'hôte (deploy/cron/rent-tool.cron). Pilotées depuis crontab sur le droplet — cette page n'est qu'une référence. L'historique de sync des calendriers est disponible sur sa propre page.",
  },
  es: {
    title: "Tareas programadas",
    subtitle: "Tareas cron configuradas en el servidor (deploy/cron/rent-tool.cron). Se controlan desde crontab en el droplet: esta página es solo de referencia. El historial de sync de calendarios está disponible en su propia página.",
  },
};

export default function AdminScheduledJobsPage() {
  const { locale } = useI18n();
  const t = COPY[locale];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {t.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {t.subtitle}
        </p>
      </div>

      <div className="space-y-3">
        {JOBS.map((job) => (
          <div
            key={job.id}
            className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--ink)]">
                {job.name[locale]}
              </h3>
              <span className="rounded bg-[var(--bg-3)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-3)]">
                {job.schedule}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--ink-4)]">
              {job.schedulePretty[locale]}
            </p>
            <p className="mt-2 text-sm text-[var(--ink-2)]">
              {job.description[locale]}
            </p>
            {job.link && (
              <div className="mt-2">
                <Link
                  href={job.link.href}
                  className="inline-flex items-center gap-1 text-xs text-[var(--ink-3)] hover:text-[var(--ink)]"
                >
                  {job.link.label[locale]}
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
