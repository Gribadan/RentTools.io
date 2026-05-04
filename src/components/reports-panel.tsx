"use client";

import { useMemo, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useI18n } from "@/lib/i18n/context";
import type { Property } from "@/lib/types";

interface ReportsPanelProps {
  properties: Property[];
  onImported?: () => void;
}

interface ImportRowResult {
  rowNumber: number;
  status: "created" | "skipped" | "error";
  reason?: string;
  reservationId?: number;
}

interface ImportResponse {
  summary: { created: number; skipped: number; error: number; dryRun: boolean };
  results: ImportRowResult[];
}

interface MonthBucket {
  key: string;
  label: string;
  year: number;
  monthIndex: number;
  totalDays: number;
  occupiedDays: number;
  occupancyPct: number;
}

function buildLastTwelveMonths(): MonthBucket[] {
  const now = new Date();
  const buckets: MonthBucket[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    buckets.push({
      key: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      year,
      monthIndex,
      totalDays,
      occupiedDays: 0,
      occupancyPct: 0,
    });
  }
  return buckets;
}

function computeOccupancy(property: Property): MonthBucket[] {
  const buckets = buildLastTwelveMonths();
  if (!property.reservations.length) return buckets;

  for (const bucket of buckets) {
    const monthStart = new Date(bucket.year, bucket.monthIndex, 1);
    const monthEnd = new Date(bucket.year, bucket.monthIndex + 1, 0); // last day of month
    const occupied = new Set<number>();

    for (const r of property.reservations) {
      const ci = new Date(r.checkIn);
      const co = new Date(r.checkOut);
      // Reservation covers checkIn..checkOut inclusive (matches stayDays calculation elsewhere)
      const start = ci > monthStart ? ci : monthStart;
      const end = co < monthEnd ? co : monthEnd;
      if (start > end) continue;

      const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const stop = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      while (cur <= stop) {
        occupied.add(cur.getDate());
        cur.setDate(cur.getDate() + 1);
      }
    }

    bucket.occupiedDays = occupied.size;
    bucket.occupancyPct = bucket.totalDays
      ? Math.round((bucket.occupiedDays / bucket.totalDays) * 100)
      : 0;
  }

  return buckets;
}

export function ReportsPanel({ properties, onImported }: ReportsPanelProps) {
  const { locale } = useI18n();
  const [propertyId, setPropertyId] = useState<number | null>(
    properties.length > 0 ? properties[0].id : null
  );
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportScope, setExportScope] = useState<"all" | "selected">("all");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importBusy, setImportBusy] = useState<"dry" | "commit" | null>(null);
  const [importResponse, setImportResponse] = useState<ImportResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const selected = properties.find((p) => p.id === propertyId) || null;

  const data = useMemo(() => {
    if (!selected) return [];
    return computeOccupancy(selected);
  }, [selected]);

  const avgPct = useMemo(() => {
    if (!data.length) return 0;
    const sum = data.reduce((acc, b) => acc + b.occupancyPct, 0);
    return Math.round(sum / data.length);
  }, [data]);

  const downloadCsv = () => {
    const params = new URLSearchParams();
    if (exportFrom) params.set("from", exportFrom);
    if (exportTo) params.set("to", exportTo);
    if (exportScope === "selected" && propertyId) params.set("propertyId", String(propertyId));
    const qs = params.toString();
    window.location.href = `/api/reservations/export${qs ? `?${qs}` : ""}`;
  };

  const runImport = async (mode: "dry" | "commit") => {
    if (!importFile) return;
    setImportBusy(mode);
    setImportError(null);
    setImportResponse(null);
    try {
      const text = await importFile.text();
      const url = `/api/reservations/import${mode === "dry" ? "?dryRun=true" : ""}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data?.error || `HTTP ${res.status}`);
      } else {
        setImportResponse(data as ImportResponse);
        if (mode === "commit" && onImported) onImported();
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Network error");
    } finally {
      setImportBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#e8e8ec]">
          {locale === "ru" ? "Отчёты" : "Reports"}
        </h1>
        <p className="mt-1 text-xs text-[#71717a]">
          {locale === "ru"
            ? "Загрузка по месяцам за последний год"
            : "Monthly occupancy for the last 12 months"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#27272b] bg-[#18181b] p-3">
        <label className="text-xs text-[#a0a0a8]">
          {locale === "ru" ? "Объект" : "Property"}
        </label>
        <select
          value={propertyId ?? ""}
          onChange={(e) => setPropertyId(Number(e.target.value) || null)}
          className="h-8 rounded-md border border-[#333338] bg-[#111113] px-2 text-xs text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
        >
          {properties.length === 0 ? (
            <option value="">
              {locale === "ru" ? "Нет объектов" : "No properties"}
            </option>
          ) : (
            properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))
          )}
        </select>
        {selected && (
          <span className="ml-auto rounded-md bg-[#27272b] px-2 py-1 text-[11px] text-[#d4d4d8]">
            {locale === "ru" ? "Среднее" : "Avg"}: <span className="font-semibold text-[#e8e8ec]">{avgPct}%</span>
          </span>
        )}
      </div>

      {selected ? (
        <div className="rounded-xl border border-[#27272b] bg-[#18181b] p-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#27272b" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#a0a0a8", fontSize: 11 }}
                  axisLine={{ stroke: "#333338" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#a0a0a8", fontSize: 11 }}
                  axisLine={{ stroke: "#333338" }}
                  tickLine={false}
                  unit="%"
                  domain={[0, 100]}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255, 56, 92, 0.08)" }}
                  contentStyle={{
                    background: "#111113",
                    border: "1px solid #333338",
                    borderRadius: 8,
                    color: "#e8e8ec",
                    fontSize: 12,
                  }}
                  formatter={(value, _name, item) => {
                    const bucket = (item as { payload?: MonthBucket } | undefined)?.payload;
                    const label = locale === "ru" ? "Загрузка" : "Occupancy";
                    if (bucket) {
                      return [
                        `${value}% (${bucket.occupiedDays}/${bucket.totalDays} ${locale === "ru" ? "дн." : "days"})`,
                        label,
                      ];
                    }
                    return [`${value}%`, label];
                  }}
                  labelStyle={{ color: "#a0a0a8" }}
                />
                <Bar dataKey="occupancyPct" fill="#ff385c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#27272b] bg-[#18181b] p-6 text-center text-xs text-[#71717a]">
          {locale === "ru" ? "Добавьте объект, чтобы видеть отчёты." : "Add a property to see reports."}
        </div>
      )}

      {/* Reservations CSV export */}
      <div className="rounded-xl border border-[#27272b] bg-[#18181b] p-4">
        <h2 className="mb-3 text-sm font-semibold text-[#e8e8ec]">
          {locale === "ru" ? "Экспорт броней (CSV)" : "Export reservations (CSV)"}
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-[#71717a]">
              {locale === "ru" ? "С" : "From"}
            </label>
            <input
              type="date"
              value={exportFrom}
              onChange={(e) => setExportFrom(e.target.value)}
              className="h-8 rounded-md border border-[#333338] bg-[#111113] px-2 text-xs text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-[#71717a]">
              {locale === "ru" ? "По" : "To"}
            </label>
            <input
              type="date"
              value={exportTo}
              onChange={(e) => setExportTo(e.target.value)}
              className="h-8 rounded-md border border-[#333338] bg-[#111113] px-2 text-xs text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-[#71717a]">
              {locale === "ru" ? "Объекты" : "Scope"}
            </label>
            <select
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value as "all" | "selected")}
              className="h-8 rounded-md border border-[#333338] bg-[#111113] px-2 text-xs text-[#e8e8ec] outline-none focus:border-[#e8e8ec]"
            >
              <option value="all">{locale === "ru" ? "Все объекты" : "All properties"}</option>
              <option value="selected" disabled={!selected}>
                {selected ? selected.name : locale === "ru" ? "Только выбранный" : "Selected only"}
              </option>
            </select>
          </div>
          <button
            onClick={downloadCsv}
            className="ml-auto h-8 rounded-md bg-[#ff385c] px-3 text-xs font-medium text-white hover:bg-[#e0294d]"
          >
            {locale === "ru" ? "Скачать CSV" : "Export reservations CSV"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-[#71717a]">
          {locale === "ru"
            ? "Пустые поля = выгрузить все. Файл с UTF-8 BOM, открывается в Excel с кириллицей."
            : "Leave dates blank to export everything. UTF-8 BOM ensures Excel opens Cyrillic correctly."}
        </p>
      </div>

      {/* Reservations CSV import */}
      <div className="rounded-xl border border-[#27272b] bg-[#18181b] p-4">
        <h2 className="mb-3 text-sm font-semibold text-[#e8e8ec]">
          {locale === "ru" ? "Импорт броней (CSV)" : "Import reservations (CSV)"}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setImportFile(f);
              setImportResponse(null);
              setImportError(null);
            }}
            className="hidden"
          />
          <button
            onClick={() => importInputRef.current?.click()}
            className="h-8 rounded-md border border-[#333338] bg-[#111113] px-3 text-xs text-[#e8e8ec] hover:border-[#e8e8ec]/50"
          >
            {locale === "ru" ? "Выбрать файл" : "Choose file"}
          </button>
          <span className="truncate text-xs text-[#a0a0a8]">
            {importFile ? importFile.name : (locale === "ru" ? "Файл не выбран" : "No file chosen")}
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => runImport("dry")}
              disabled={!importFile || importBusy !== null}
              className="h-8 rounded-md border border-[#333338] bg-[#111113] px-3 text-xs text-[#e8e8ec] hover:border-[#e8e8ec]/50 disabled:opacity-50"
            >
              {importBusy === "dry"
                ? (locale === "ru" ? "Анализ..." : "Analyzing...")
                : (locale === "ru" ? "Превью" : "Dry run")}
            </button>
            <button
              onClick={() => runImport("commit")}
              disabled={!importFile || importBusy !== null}
              className="h-8 rounded-md bg-[#ff385c] px-3 text-xs font-medium text-white hover:bg-[#e0294d] disabled:opacity-50"
            >
              {importBusy === "commit"
                ? (locale === "ru" ? "Импорт..." : "Importing...")
                : (locale === "ru" ? "Импортировать" : "Import")}
            </button>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-[#71717a]">
          {locale === "ru"
            ? "Колонки: propertyId, name, platform, checkIn, checkOut. Пересекающиеся брони пропускаются."
            : "Required columns: propertyId, name, platform, checkIn, checkOut. Overlapping rows are skipped."}
        </p>
        {importError && (
          <p className="mt-2 text-xs text-[#ef4444]">{importError}</p>
        )}
        {importResponse && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded bg-[#34d399]/15 px-2 py-0.5 text-[#34d399]">
                {locale === "ru" ? "Создано" : "Created"}: {importResponse.summary.created}
              </span>
              <span className="rounded bg-[#fbbf24]/15 px-2 py-0.5 text-[#fbbf24]">
                {locale === "ru" ? "Пропущено" : "Skipped"}: {importResponse.summary.skipped}
              </span>
              <span className="rounded bg-[#ef4444]/15 px-2 py-0.5 text-[#ef4444]">
                {locale === "ru" ? "Ошибок" : "Errors"}: {importResponse.summary.error}
              </span>
              {importResponse.summary.dryRun && (
                <span className="rounded bg-[#27272b] px-2 py-0.5 text-[#a0a0a8]">
                  {locale === "ru" ? "Превью (без записи)" : "Dry run (no writes)"}
                </span>
              )}
            </div>
            <ul className="max-h-64 divide-y divide-[#27272b] overflow-y-auto rounded-md border border-[#27272b] bg-[#111113]">
              {importResponse.results.map((r) => (
                <li
                  key={`${r.rowNumber}-${r.status}`}
                  className="flex items-start justify-between gap-3 px-3 py-1.5 text-[11px]"
                >
                  <span className="shrink-0 font-mono text-[#71717a]">
                    {locale === "ru" ? "Строка" : "Row"} {r.rowNumber}
                  </span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 ${
                      r.status === "created"
                        ? "bg-[#34d399]/15 text-[#34d399]"
                        : r.status === "skipped"
                        ? "bg-[#fbbf24]/15 text-[#fbbf24]"
                        : "bg-[#ef4444]/15 text-[#ef4444]"
                    }`}
                  >
                    {r.status}
                  </span>
                  <span className="flex-1 truncate text-right text-[#a0a0a8]">
                    {r.reason || (r.reservationId ? `#${r.reservationId}` : "")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
