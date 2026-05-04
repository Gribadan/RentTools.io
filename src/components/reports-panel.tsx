"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useI18n } from "@/lib/i18n/context";
import type { Property } from "@/lib/types";

interface ReportsPanelProps {
  properties: Property[];
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

export function ReportsPanel({ properties }: ReportsPanelProps) {
  const { locale } = useI18n();
  const [propertyId, setPropertyId] = useState<number | null>(
    properties.length > 0 ? properties[0].id : null
  );

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
    </div>
  );
}
