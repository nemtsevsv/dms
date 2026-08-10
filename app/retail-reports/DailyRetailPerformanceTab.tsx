"use client";

import { useMemo, useState } from "react";
import { exportToXlsx } from "@/lib/exportXlsx";
import { Download } from "lucide-react";
import RatingIndicator from "@/components/RatingIndicator";
import RetailFunnel from "../retail-dashboard/RetailFunnel";
import MonthlyTargetActualChart from "../retail-dashboard/MonthlyTargetActualChart";
import { isDayDataReady } from "@/lib/chartVisibility";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function avg(nums: (number | null)[]): number | null {
  const vals = nums.filter((n): n is number => n !== null && n !== undefined);
  if (vals.length === 0) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function DailyRetailPerformanceTab({ bundle, storeIds }: { bundle: any; storeIds: string[] }) {
  const stores = bundle.stores.filter((s: any) => storeIds.includes(s.id));
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const store = stores.find((s: any) => s.id === storeId);
  const localCurrency = store?.currency ?? "EUR";
  const fxRate = store?.fxRate || 1;
  const [currency, setCurrency] = useState<"local" | "EUR">("EUR");
  const rate = currency === "EUR" ? fxRate : 1;
  const displayCurrency = currency === "EUR" ? "EUR" : localCurrency;

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const allMonthKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const r of bundle.dailyReports) if (r.storeId === storeId) keys.add(r.date.slice(0, 7));
    for (const p of bundle.plans) if (p.storeId === storeId) keys.add(`${p.year}-${String(p.month).padStart(2, "0")}`);
    keys.add(currentMonthKey);
    return Array.from(keys).sort();
  }, [bundle, storeId, currentMonthKey]);

  // Only a single month may be selected, defaulting to the current one.
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const activeMonth = allMonthKeys.includes(monthKey) ? monthKey : currentMonthKey;
  const [year, month] = activeMonth.split("-").map(Number);
  const dayCount = daysInMonth(year, month);
  const monthlyPlan = (bundle.plans as any[]).find((p: any) => p.storeId === storeId && p.year === year && p.month === month)?.planLocal ?? 0;
  const dailyTarget = monthlyPlan > 0 ? monthlyPlan / dayCount : 0;

  const perDay = useMemo(() => {
    const map = new Map<
      string,
      {
        visitors: number; newV: number; existingV: number; calls: number; testDrives: number;
        receipts: number; actual: number; core: number; accessories: number;
        weather: number[]; season: number[]; expectations: number[]; selfEval: number[];
      }
    >();
    function ensure(key: string) {
      if (!map.has(key))
        map.set(key, { visitors: 0, newV: 0, existingV: 0, calls: 0, testDrives: 0, receipts: 0, actual: 0, core: 0, accessories: 0, weather: [], season: [], expectations: [], selfEval: [] });
      return map.get(key)!;
    }
    for (const t of bundle.traffic) {
      if (t.storeId !== storeId || t.date.slice(0, 7) !== activeMonth) continue;
      const e = ensure(t.date);
      if (t.eventType === "visitor") {
        e.visitors++;
        if (t.customerType === "new") e.newV++;
        else e.existingV++;
      } else if (t.eventType === "call") e.calls++;
      else if (t.eventType === "test_drive") e.testDrives++;
    }
    for (const r of bundle.receipts) {
      if (r.storeId !== storeId || r.date.slice(0, 7) !== activeMonth) continue;
      const e = ensure(r.date);
      e.receipts++;
      for (const it of r.items) {
        e.actual += it.total;
        if (it.itemType === "core") e.core += it.total;
        else e.accessories += it.total;
      }
    }
    for (const d of bundle.dailyReports) {
      if (d.storeId !== storeId || d.date.slice(0, 7) !== activeMonth) continue;
      const e = ensure(d.date);
      if (d.weather !== null) e.weather.push(d.weather);
      if (d.season !== null) e.season.push(d.season);
      if (d.expectedVisitors !== null) e.expectations.push(d.expectedVisitors);
      if (d.expectedCustomers !== null) e.expectations.push(d.expectedCustomers);
      if (d.selfEvaluation !== null) e.selfEval.push(d.selfEvaluation);
    }
    return map;
  }, [bundle, storeId, activeMonth]);

  const dayCols = Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    const key = `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
    return { key, date: d, label: String(i + 1) };
  });

  const chartData = dayCols.map((c) => {
    const e = perDay.get(c.key);
    return {
      label: c.label,
      date: c.date,
      target: dailyTarget / fxRate,
      actual: (e?.actual ?? 0) / fxRate,
      traffic: e?.visitors ?? 0,
    };
  });

  const funnelTotals = dayCols.reduce(
    (acc, c) => {
      const e = perDay.get(c.key);
      return { visitors: acc.visitors + (e?.visitors ?? 0), testDrives: acc.testDrives + (e?.testDrives ?? 0), receipts: acc.receipts + (e?.receipts ?? 0) };
    },
    { visitors: 0, testDrives: 0, receipts: 0 }
  );

  function handleExport() {
    const header = ["Metric", ...dayCols.map((c) => c.key)];
    const rows: (string | number)[][] = [];
    const metricRow = (label: string, fn: (e: any) => string | number) => [label, ...dayCols.map((c) => fn(perDay.get(c.key) ?? {}))];
    rows.push(metricRow("Weather (1-5)", (e) => (avg(e.weather) ?? "").toString()));
    rows.push(metricRow("Season (1-5)", (e) => (avg(e.season) ?? "").toString()));
    rows.push(metricRow("Expectations (1-5)", (e) => (avg(e.expectations) ?? "").toString()));
    rows.push(metricRow("Visitors", (e) => e.visitors ?? 0));
    rows.push(metricRow("  New", (e) => e.newV ?? 0));
    rows.push(metricRow("  Existing", (e) => e.existingV ?? 0));
    rows.push(metricRow("Calls", (e) => e.calls ?? 0));
    rows.push(metricRow("Test Drives", (e) => e.testDrives ?? 0));
    rows.push(metricRow("Receipts", (e) => e.receipts ?? 0));
    rows.push(metricRow(`Sales, ${displayCurrency}`, (e) => Math.round((e.actual ?? 0) / rate)));
    rows.push(metricRow(`  Core Items, ${displayCurrency}`, (e) => Math.round((e.core ?? 0) / rate)));
    rows.push(metricRow(`  Accessories, ${displayCurrency}`, (e) => Math.round((e.accessories ?? 0) / rate)));
    rows.push(metricRow("Conversion %", (e) => (e.visitors > 0 ? Math.round((e.receipts / e.visitors) * 100) : 0)));
    rows.push(metricRow("Average Receipt", (e) => (e.receipts > 0 ? Math.round(e.actual / rate / e.receipts) : 0)));
    rows.push(metricRow("Target Achievement %", (e) => (dailyTarget > 0 ? Math.round(((e.actual ?? 0) / dailyTarget) * 100) : 0)));
    rows.push(metricRow("Self Evaluation (1-5)", (e) => (avg(e.selfEval) ?? "").toString()));
    exportToXlsx(`daily-retail-performance-${store?.name ?? "store"}-${activeMonth}`, header, rows);
  }

  function SectionHeader({ label }: { label: string }) {
    return (
      <tr className="bg-slate-100">
        <td colSpan={dayCols.length + 1} className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </td>
      </tr>
    );
  }

  function MetricRow({ label, indent, visual, fn }: { label: string; indent?: boolean; visual?: boolean; fn: (e: any) => any }) {
    return (
      <tr className="border-t border-slate-100">
        <td className={`px-3 py-1.5 text-xs text-slate-600 whitespace-nowrap ${indent ? "pl-8" : ""}`}>{label}</td>
        {dayCols.map((c) => {
          const e = perDay.get(c.key) ?? {};
          const val = fn(e);
          return (
            <td key={c.key} className="px-2 py-1.5 text-right text-xs">
              {visual ? (
                <div className="flex justify-end">
                  <RatingIndicator value={val as number | null} />
                </div>
              ) : (
                val ?? "—"
              )}
            </td>
          );
        })}
      </tr>
    );
  }

  return (
    <div>
      {stores.length === 0 ? (
        <p className="text-sm text-slate-400">No active stores to report on.</p>
      ) : (
        <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {stores.length > 1 && (
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            {stores.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <select value={activeMonth} onChange={(e) => setMonthKey(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          {allMonthKeys.map((k) => {
            const [y, m] = k.split("-");
            return (
              <option key={k} value={k}>
                {MONTH_NAMES[Number(m) - 1]} {y}
              </option>
            );
          })}
        </select>
        <select value={currency} onChange={(e) => setCurrency(e.target.value as "local" | "EUR")} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option value="local">{localCurrency}</option>
          <option value="EUR">EUR</option>
        </select>
        <button onClick={handleExport} className="ml-auto flex items-center gap-2 px-3 py-2 border border-emerald-300 text-emerald-700 rounded-lg text-sm hover:bg-emerald-50">
          <Download size={14} />
          Export to Excel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="font-medium mb-4">Conversion Funnel ({MONTH_NAMES[month - 1]} {year})</h2>
          <RetailFunnel visitors={funnelTotals.visitors} testDrives={funnelTotals.testDrives} receipts={funnelTotals.receipts} />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="font-medium mb-4">Sales Target vs Actual — by Days</h2>
          <MonthlyTargetActualChart data={chartData} readyFn={isDayDataReady} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase">
            <tr>
              <th className="text-left px-3 py-2 whitespace-nowrap">Metric</th>
              {dayCols.map((c) => (
                <th key={c.key} className="text-right px-2 py-2 whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SectionHeader label="Environment" />
            <MetricRow label="Weather" visual fn={(e) => avg(e.weather)} />
            <MetricRow label="Season" visual fn={(e) => avg(e.season)} />
            <MetricRow label="Expectations" visual fn={(e) => avg(e.expectations)} />

            <SectionHeader label="Traffic & Activities" />
            <MetricRow label="Visitors" fn={(e) => e.visitors} />
            <MetricRow label="New" indent fn={(e) => e.newV} />
            <MetricRow label="Existing" indent fn={(e) => e.existingV} />
            <MetricRow label="Calls" fn={(e) => e.calls} />
            <MetricRow label="Test Drives" fn={(e) => e.testDrives} />

            <SectionHeader label="Sales" />
            <MetricRow label="Receipts" fn={(e) => e.receipts} />
            <MetricRow label={`Sales, ${displayCurrency}`} fn={(e) => Math.round((e.actual ?? 0) / rate).toLocaleString("de-DE")} />
            <MetricRow label={`Core Items, ${displayCurrency}`} indent fn={(e) => Math.round((e.core ?? 0) / rate).toLocaleString("de-DE")} />
            <MetricRow label={`Accessories, ${displayCurrency}`} indent fn={(e) => Math.round((e.accessories ?? 0) / rate).toLocaleString("de-DE")} />

            <SectionHeader label="Performance" />
            <MetricRow label="Conversion" fn={(e) => (e.visitors > 0 ? `${Math.round((e.receipts / e.visitors) * 100)}%` : "—")} />
            <MetricRow label="Average Receipt" fn={(e) => (e.receipts > 0 ? Math.round(e.actual / rate / e.receipts).toLocaleString("de-DE") : "—")} />
            <MetricRow label="Target Achievement" fn={(e) => (dailyTarget > 0 ? `${Math.round(((e.actual ?? 0) / dailyTarget) * 100)}%` : "—")} />
            <MetricRow label="Self Evaluation" visual fn={(e) => avg(e.selfEval)} />
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
}
