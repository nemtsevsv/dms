"use client";

import { useMemo, useState } from "react";
import { exportToXlsx } from "@/lib/exportXlsx";
import { Download } from "lucide-react";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import RatingIndicator from "@/components/RatingIndicator";
import RetailFunnel from "../retail-dashboard/RetailFunnel";
import MonthlyTargetActualChart from "../retail-dashboard/MonthlyTargetActualChart";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function avg(nums: (number | null)[]): number | null {
  const vals = nums.filter((n): n is number => n !== null && n !== undefined);
  if (vals.length === 0) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

export default function RetailPerformanceTab({ bundle, storeIds }: { bundle: any; storeIds: string[] }) {
  const stores = bundle.stores.filter((s: any) => storeIds.includes(s.id));
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const store = stores.find((s: any) => s.id === storeId);
  const localCurrency = store?.currency ?? "EUR";
  const fxRate = store?.fxRate ?? 1;
  const [currency, setCurrency] = useState<"local" | "EUR">("EUR");
  const rate = currency === "EUR" ? fxRate : 1;
  const displayCurrency = currency === "EUR" ? "EUR" : localCurrency;

  const allMonthKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const r of bundle.dailyReports) if (r.storeId === storeId) keys.add(r.date.slice(0, 7));
    for (const p of bundle.plans) if (p.storeId === storeId) keys.add(`${p.year}-${String(p.month).padStart(2, "0")}`);
    return Array.from(keys).sort();
  }, [bundle, storeId]);

  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const activeMonths = selectedMonths.length === 0 ? allMonthKeys : selectedMonths;

  const perMonth = useMemo(() => {
    const map = new Map<
      string,
      {
        target: number; actual: number; visitors: number; newV: number; existingV: number; calls: number; testDrives: number;
        receipts: number; core: number; accessories: number;
        weather: number[]; season: number[]; expectations: number[]; selfEval: number[];
      }
    >();
    function ensure(key: string) {
      if (!map.has(key))
        map.set(key, { target: 0, actual: 0, visitors: 0, newV: 0, existingV: 0, calls: 0, testDrives: 0, receipts: 0, core: 0, accessories: 0, weather: [], season: [], expectations: [], selfEval: [] });
      return map.get(key)!;
    }
    for (const p of bundle.plans) {
      if (p.storeId !== storeId) continue;
      ensure(`${p.year}-${String(p.month).padStart(2, "0")}`).target += p.planLocal;
    }
    for (const t of bundle.traffic) {
      if (t.storeId !== storeId) continue;
      const e = ensure(t.date.slice(0, 7));
      if (t.eventType === "visitor") {
        e.visitors++;
        if (t.customerType === "new") e.newV++;
        else e.existingV++;
      } else if (t.eventType === "call") e.calls++;
      else if (t.eventType === "test_drive") e.testDrives++;
    }
    for (const r of bundle.receipts) {
      if (r.storeId !== storeId) continue;
      const e = ensure(r.date.slice(0, 7));
      e.receipts++;
      for (const it of r.items) {
        e.actual += it.total;
        if (it.itemType === "core") e.core += it.total;
        else e.accessories += it.total;
      }
    }
    for (const d of bundle.dailyReports) {
      if (d.storeId !== storeId) continue;
      const e = ensure(d.date.slice(0, 7));
      if (d.weather !== null) e.weather.push(d.weather);
      if (d.season !== null) e.season.push(d.season);
      if (d.expectedVisitors !== null) e.expectations.push(d.expectedVisitors);
      if (d.expectedCustomers !== null) e.expectations.push(d.expectedCustomers);
      if (d.selfEvaluation !== null) e.selfEval.push(d.selfEvaluation);
    }
    return map;
  }, [bundle, storeId]);

  const chartData = allMonthKeys.map((key) => {
    const [y, m] = key.split("-");
    const e = perMonth.get(key);
    return {
      label: `${MONTH_NAMES[Number(m) - 1]} ${y.slice(2)}`,
      target: (e?.target ?? 0) / fxRate,
      actual: (e?.actual ?? 0) / fxRate,
      traffic: e?.visitors ?? 0,
    };
  });

  const funnelTotals = activeMonths.reduce(
    (acc, key) => {
      const e = perMonth.get(key);
      return { visitors: acc.visitors + (e?.visitors ?? 0), testDrives: acc.testDrives + (e?.testDrives ?? 0), receipts: acc.receipts + (e?.receipts ?? 0) };
    },
    { visitors: 0, testDrives: 0, receipts: 0 }
  );

  function handleExport() {
    const header = ["Metric", ...activeMonths];
    const rows: (string | number)[][] = [];
    const metricRow = (label: string, fn: (e: any) => string | number) => [label, ...activeMonths.map((k) => fn(perMonth.get(k) ?? {}))];
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
    rows.push(metricRow("Test-Drive KPI %", (e) => (e.testDrives ? Math.round((e.testDrives / (10 * 4.33)) * 100) : 0)));
    rows.push(metricRow("Average Receipt", (e) => (e.receipts > 0 ? Math.round(e.actual / rate / e.receipts) : 0)));
    rows.push(metricRow("Target Achievement %", (e) => (e.target > 0 ? Math.round((e.actual / e.target) * 100) : 0)));
    rows.push(metricRow("Self Evaluation (1-5)", (e) => (avg(e.selfEval) ?? "").toString()));
    exportToXlsx(`retail-performance-${store?.name ?? "store"}`, header, rows);
  }

  const monthCols = activeMonths.map((k) => {
    const [y, m] = k.split("-");
    return { key: k, label: `${MONTH_NAMES[Number(m) - 1]} ${y}` };
  });

  function SectionHeader({ label }: { label: string }) {
    return (
      <tr className="bg-slate-100">
        <td colSpan={monthCols.length + 1} className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </td>
      </tr>
    );
  }

  function MetricRow({ label, indent, visual, fn }: { label: string; indent?: boolean; visual?: boolean; fn: (e: any) => any }) {
    return (
      <tr className="border-t border-slate-100">
        <td className={`px-3 py-1.5 text-xs text-slate-600 ${indent ? "pl-8" : ""}`}>{label}</td>
        {monthCols.map((c) => {
          const e = perMonth.get(c.key) ?? {};
          const val = fn(e);
          return (
            <td key={c.key} className="px-3 py-1.5 text-right text-xs">
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
        <MultiSelectDropdown label="Months" options={allMonthKeys} selected={selectedMonths} onChange={setSelectedMonths} />
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
          <h2 className="font-medium mb-4">Conversion Funnel (selected months)</h2>
          <RetailFunnel visitors={funnelTotals.visitors} testDrives={funnelTotals.testDrives} receipts={funnelTotals.receipts} />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="font-medium mb-4">Sales Target vs Actual — by Month</h2>
          <MonthlyTargetActualChart data={chartData} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase">
            <tr>
              <th className="text-left px-3 py-2">Metric</th>
              {monthCols.map((c) => (
                <th key={c.key} className="text-right px-3 py-2 whitespace-nowrap">
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
            <MetricRow label="Test-Drive KPI" fn={(e) => (e.testDrives ? `${Math.round((e.testDrives / (10 * 4.33)) * 100)}%` : "—")} />
            <MetricRow label="Average Receipt" fn={(e) => (e.receipts > 0 ? Math.round(e.actual / rate / e.receipts).toLocaleString("de-DE") : "—")} />
            <MetricRow label="Target Achievement" fn={(e) => (e.target > 0 ? `${Math.round((e.actual / e.target) * 100)}%` : "—")} />
            <MetricRow label="Self Evaluation" visual fn={(e) => avg(e.selfEval)} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
