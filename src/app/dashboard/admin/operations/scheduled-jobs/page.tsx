"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

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
  name: { en: string; ru: string };
  schedule: string;
  schedulePretty: { en: string; ru: string };
  description: { en: string; ru: string };
  link?: { href: string; label: { en: string; ru: string } };
}

const JOBS: ReadonlyArray<ScheduledJob> = [
  {
    id: "calendar-sync",
    name: { en: "Calendar sync", ru: "Синхронизация календарей" },
    schedule: "*/10 * * * *",
    schedulePretty: { en: "Every 10 minutes", ru: "Каждые 10 минут" },
    description: {
      en: "Pulls every CalendarLink's iCal feed, writes events into CalendarEvent, records the result into SyncLog.",
      ru: "Загружает iCal фиды по каждой CalendarLink, пишет события в CalendarEvent, журнал в SyncLog.",
    },
    link: {
      href: "/dashboard/admin/operations/sync-logs",
      label: { en: "View sync logs", ru: "Логи синхронизации" },
    },
  },
  {
    id: "db-backup",
    name: { en: "SQLite backup", ru: "Резервная копия SQLite" },
    schedule: "15 3 * * *",
    schedulePretty: { en: "Daily at 03:15 UTC", ru: "Ежедневно в 03:15 UTC" },
    description: {
      en: "Snapshot of data/prod.db with tiered retention (14 daily / 8 weekly / 6 monthly).",
      ru: "Снимок data/prod.db с многоуровневым хранением (14 дн / 8 нед / 6 мес).",
    },
  },
  {
    id: "resource-check",
    name: { en: "Resource check", ru: "Проверка ресурсов" },
    schedule: "5 * * * *",
    schedulePretty: { en: "Hourly at :05", ru: "Каждый час в :05" },
    description: {
      en: "Alerts on RAM or disk usage above the configured warning thresholds. Posts to Telegram or webhook.",
      ru: "Уведомляет при превышении пороговых значений RAM или диска. Отправляет в Telegram или webhook.",
    },
  },
  {
    id: "restore-drill",
    name: { en: "Backup restore drill", ru: "Проверка восстановления" },
    schedule: "30 4 1 * *",
    schedulePretty: { en: "Monthly on the 1st at 04:30 UTC", ru: "1-го числа в 04:30 UTC" },
    description: {
      en: "Restores the latest monthly snapshot into a temp DB and runs sanity queries. Proves backups are usable.",
      ru: "Восстанавливает последний месячный снимок во временную БД и проверяет запросами. Подтверждает, что резервная копия рабочая.",
    },
  },
];

export default function AdminScheduledJobsPage() {
  const { locale } = useI18n();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--ink)]">
          {locale === "ru" ? "Запланированные задачи" : "Scheduled jobs"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-4)]">
          {locale === "ru"
            ? "Задачи cron, настроенные на сервере (deploy/cron/rent-tool.cron). Управляются из crontab на хосте — здесь только справочник. История синхронизации календарей доступна на отдельной странице."
            : "Cron jobs configured on the host (deploy/cron/rent-tool.cron). Controlled from crontab on the droplet — this page is reference only. Calendar sync history is available on its own page."}
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
                {locale === "ru" ? job.name.ru : job.name.en}
              </h3>
              <span className="rounded bg-[var(--bg-3)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--ink-3)]">
                {job.schedule}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--ink-4)]">
              {locale === "ru" ? job.schedulePretty.ru : job.schedulePretty.en}
            </p>
            <p className="mt-2 text-sm text-[var(--ink-2)]">
              {locale === "ru" ? job.description.ru : job.description.en}
            </p>
            {job.link && (
              <div className="mt-2">
                <Link
                  href={job.link.href}
                  className="inline-flex items-center gap-1 text-xs text-[var(--ink-3)] hover:text-[var(--ink)]"
                >
                  {locale === "ru" ? job.link.label.ru : job.link.label.en}
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
