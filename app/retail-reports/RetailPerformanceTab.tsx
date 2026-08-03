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
  const fxRate = stores.find((s: any) => s.id === storeId)?.fxRate ?? 1;
  const currency = stores.find((s: any) => s.id === storeId)?.currency ?? "EUR";

  const allMonthKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const r of bundle.dailyReports) if (r.storeId === storeId) keys.add(r.date.slice(0, 7));
    for (const p of bundle.plans) if (p.storeId === storeId) keys.add(`${p.year}-${String(p.month).padStart(2, "0")}`);
    return Array.from(keys).sort();
  }, [bundle, storeId]);

  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const activeMonths = selectedMonths.length === 0 ? allMonthKeys : selectedMonths;

  // Per-month aggregate, used both for the chart (all FY months) and table (selected months)
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

  // Chart always shows the 12 FY months for context
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
    const header = ["Metric", ...activeMonths.map((k) => k)];
    const rows: (string | number)[][] = [];
    const metricRow = (label: string, fn: (e: any) => string | number) => [label, ...activeMonths.map((k) => fn(perMonth.get(k) ?? {}))];
    rows.push(metricRow("Average Weather (1-5)", (e) => (avg(e.weather) ?? "").toString()));
    rows.push(metricRow("Average Season (1-5)", (e) => (avg(e.season) ?? "").toString()));
    rows.push(metricRow("Average Expectations (1-5)", (e) => (avg(e.expectations) ?? "").toString()));
    rows.push(metricRow("Visitors (Total)", (e) => e.visitors ?? 0));
    rows.push(metricRow("New", (e) => e.newV ?? 0));
    rows.push(metricRow("Existing", (e) => e.existingV ?? 0));
    rows.push(metricRow("Calls (Total)", (e) => e.calls ?? 0));
    rows.push(metricRow("Test Drives (Total)", (e) => e.testDrives ?? 0));
    rows.push(metricRow("Receipts (Total)", (e) => e.receipts ?? 0));
    rows.push(metricRow("Sales", (e) => e.actual ?? 0));
    rows.push(metricRow("Core Items", (e) => e.core ?? 0));
    rows.push(metricRow("Accessories", (e) => e.accessories ?? 0));
    rows.push(metricRow("Average Receipt", (e) => (e.receipts > 0 ? Math.round(e.actual / e.receipts) : 0)));
    rows.push(metricRow("Conversion %", (e) => (e.visitors > 0 ? Math.round((e.receipts / e.visitors) * 100) : 0)));
    rows.push(metricRow("Target Achievement %", (e) => (e.target > 0 ? Math.round((e.actual / e.target) * 100) : 0)));
    rows.push(metricRow("Average Self Evaluation (1-5)", (e) => (avg(e.selfEval) ?? "").toString()));
    exportToXlsx(`retail-performance-${stores.find((s: any) => s.id === storeId)?.name ?? "store"}`, header, rows);
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
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Metric</th>
              {activeMonths.map((k) => {
                const [y, m] = k.split("-");
                return (
                  <th key={k} className="text-right px-4 py-3 whitespace-nowrap">
                    {MONTH_NAMES[Number(m) - 1]} {y}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Average Weather", visual: true, fn: (e: any) => avg(e.weather) },
              { label: "Average Season", visual: true, fn: (e: any) => avg(e.season) },
              { label: "Average Expectations", visual: true, fn: (e: any) => avg(e.expectations) },
              { label: "Visitors (Total)", fn: (e: any) => e.visitors },
              { label: "New", fn: (e: any) => e.newV },
              { label: "Existing", fn: (e: any) => e.existingV },
              { label: "Calls (Total)", fn: (e: any) => e.calls },
              { label: "Test Drives (Total)", fn: (e: any) => e.testDrives },
              { label: "Receipts (Total)", fn: (e: any) => e.receipts },
              { label: "Sales", fn: (e: any) => `${Math.round(e.actual).toLocaleString("de-DE")} ${currency}` },
              { label: "Core Items", fn: (e: any) => `${Math.round(e.core).toLocaleString("de-DE")} ${currency}` },
              { label: "Accessories", fn: (e: any) => `${Math.round(e.accessories).toLocaleString("de-DE")} ${currency}` },
              { label: "Average Receipt", fn: (e: any) => (e.receipts > 0 ? Math.round(e.actual / e.receipts).toLocaleString("de-DE") : "—") },
              { label: "Conversion", fn: (e: any) => (e.visitors > 0 ? `${Math.round((e.receipts / e.visitors) * 100)}%` : "—") },
              { label: "Target Achievement", fn: (e: any) => (e.target > 0 ? `${Math.round((e.actual / e.target) * 100)}%` : "—") },
              { label: "Average Self Evaluation", visual: true, fn: (e: any) => avg(e.selfEval) },
            ].map((row) => (
              <tr key={row.label} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-600">{row.label}</td>
                {activeMonths.map((k) => {
                  const e = perMonth.get(k) ?? {};
                  const val = row.fn(e);
                  return (
                    <td key={k} className="px-4 py-3 text-right">
                      {row.visual ? (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
