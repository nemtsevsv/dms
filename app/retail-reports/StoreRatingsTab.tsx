"use client";

import { useMemo, useState } from "react";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_ROW = ["bg-amber-50 border-amber-300", "bg-slate-50 border-slate-300", "bg-orange-50 border-orange-200"];

export default function StoreRatingsTab({ bundle }: { bundle: any }) {
  const [storeFilter, setStoreFilter] = useState("all");
  const [monthKey, setMonthKey] = useState("all");

  const allMonthKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const r of bundle.dailyReports) keys.add(r.date.slice(0, 7));
    return Array.from(keys).sort();
  }, [bundle]);

  const storeMap = new Map(bundle.stores.map((s: any) => [s.id, s]));

  const filteredReceipts = useMemo(
    () => bundle.receipts.filter((r: any) => (storeFilter === "all" || r.storeId === storeFilter) && (monthKey === "all" || r.date.slice(0, 7) === monthKey)),
    [bundle, storeFilter, monthKey]
  );
  const filteredTraffic = useMemo(
    () => bundle.traffic.filter((t: any) => (storeFilter === "all" || t.storeId === storeFilter) && (monthKey === "all" || t.date.slice(0, 7) === monthKey)),
    [bundle, storeFilter, monthKey]
  );
  const filteredReports = useMemo(
    () => bundle.dailyReports.filter((r: any) => (storeFilter === "all" || r.storeId === storeFilter) && (monthKey === "all" || r.date.slice(0, 7) === monthKey)),
    [bundle, storeFilter, monthKey]
  );

  // ---- Top Stores (EUR-normalized so different currencies compare fairly) ----
  const storeStats = useMemo(() => {
    const map = new Map<string, { sales: number; core: number; accessories: number; traffic: number; receipts: number }>();
    for (const t of filteredTraffic) {
      if (t.eventType !== "visitor") continue;
      const e = map.get(t.storeId) ?? { sales: 0, core: 0, accessories: 0, traffic: 0, receipts: 0 };
      e.traffic++;
      map.set(t.storeId, e);
    }
    for (const r of filteredReceipts) {
      const e = map.get(r.storeId) ?? { sales: 0, core: 0, accessories: 0, traffic: 0, receipts: 0 };
      e.receipts++;
      for (const it of r.items) {
        const fx = (storeMap.get(r.storeId) as any)?.fxRate ?? 1;
        e.sales += it.total / fx;
        if (it.itemType === "core") e.core += it.total / fx;
        else e.accessories += it.total / fx;
      }
      map.set(r.storeId, e);
    }
    return Array.from(map.entries())
      .map(([storeId, s]) => ({
        storeId,
        name: (storeMap.get(storeId) as any)?.name ?? "—",
        ...s,
        conversionPct: s.traffic > 0 ? (s.receipts / s.traffic) * 100 : 0,
        avgReceipt: s.receipts > 0 ? s.sales / s.receipts : 0,
        stockValueEur: (bundle.stockValueByStore[storeId] ?? 0) / ((storeMap.get(storeId) as any)?.fxRate ?? 1),
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [filteredReceipts, filteredTraffic, storeMap, bundle.stockValueByStore]);

  // ---- Top Sellers (by store_receipts.created_by) ----
  const sellerStats = useMemo(() => {
    const map = new Map<string, { sales: number; core: number; accessories: number; traffic: number; receipts: number; shifts: number }>();
    for (const r of filteredReceipts) {
      const seller = r.createdBy ?? "Unknown";
      const e = map.get(seller) ?? { sales: 0, core: 0, accessories: 0, traffic: 0, receipts: 0, shifts: 0 };
      e.receipts++;
      const fx = (storeMap.get(r.storeId) as any)?.fxRate ?? 1;
      for (const it of r.items) {
        e.sales += it.total / fx;
        if (it.itemType === "core") e.core += it.total / fx;
        else e.accessories += it.total / fx;
      }
      map.set(seller, e);
    }
    for (const t of filteredTraffic) {
      if (t.eventType !== "visitor" || !t.createdBy) continue;
      const e = map.get(t.createdBy) ?? { sales: 0, core: 0, accessories: 0, traffic: 0, receipts: 0, shifts: 0 };
      e.traffic++;
      map.set(t.createdBy, e);
    }
    for (const r of filteredReports) {
      const seller = r.submittedBy ?? "Unknown";
      const e = map.get(seller) ?? { sales: 0, core: 0, accessories: 0, traffic: 0, receipts: 0, shifts: 0 };
      e.shifts++;
      map.set(seller, e);
    }
    return Array.from(map.entries())
      .filter(([email]) => email !== "Unknown")
      .map(([email, s]) => ({
        email,
        displayName: bundle.sellerNames[email] ?? email,
        conversionPct: s.traffic > 0 ? (s.receipts / s.traffic) * 100 : 0,
        ...s,
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [filteredReceipts, filteredReports, filteredTraffic, storeMap, bundle.sellerNames]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option value="all">All Stores</option>
          {bundle.stores.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={monthKey} onChange={(e) => setMonthKey(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option value="all">Whole Year</option>
          {allMonthKeys.map((m) => {
            const [y, mo] = m.split("-");
            return (
              <option key={m} value={m}>
                {MONTH_NAMES[Number(mo) - 1]} {y}
              </option>
            );
          })}
        </select>
      </div>

      <h2 className="font-medium mb-3">Top Stores</h2>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm mb-8">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Store Name</th>
              <th className="text-right px-4 py-3">Total Sales (EUR)</th>
              <th className="text-right px-4 py-3">Core Items</th>
              <th className="text-right px-4 py-3">Accessories</th>
              <th className="text-right px-4 py-3">Traffic</th>
              <th className="text-right px-4 py-3">Receipts</th>
              <th className="text-right px-4 py-3">Conversion</th>
              <th className="text-right px-4 py-3">Avg. Receipt</th>
              <th className="text-right px-4 py-3">Stock Value (RSP)</th>
            </tr>
          </thead>
          <tbody>
            {storeStats.map((s, idx) => (
              <tr key={s.storeId} className={`border-t text-sm ${idx < 3 ? `border-2 ${MEDAL_ROW[idx]} font-medium` : "border-slate-100"}`}>
                <td className="px-4 py-3">{idx < 3 ? <span className="text-lg">{MEDALS[idx]}</span> : idx + 1}</td>
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 text-right">{Math.round(s.sales).toLocaleString("de-DE")}</td>
                <td className="px-4 py-3 text-right">{Math.round(s.core).toLocaleString("de-DE")}</td>
                <td className="px-4 py-3 text-right">{Math.round(s.accessories).toLocaleString("de-DE")}</td>
                <td className="px-4 py-3 text-right">{s.traffic}</td>
                <td className="px-4 py-3 text-right">{s.receipts}</td>
                <td className="px-4 py-3 text-right">{Math.round(s.conversionPct)}%</td>
                <td className="px-4 py-3 text-right">{Math.round(s.avgReceipt).toLocaleString("de-DE")}</td>
                <td className="px-4 py-3 text-right">{Math.round(s.stockValueEur).toLocaleString("de-DE")}</td>
              </tr>
            ))}
            {storeStats.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-slate-400">
                  No data for this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="font-medium mb-3">Top Sellers</h2>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Display Name</th>
              <th className="text-right px-4 py-3">Total Sales (EUR)</th>
              <th className="text-right px-4 py-3">Core Items</th>
              <th className="text-right px-4 py-3">Accessories</th>
              <th className="text-right px-4 py-3">Shifts</th>
              <th className="text-right px-4 py-3">Traffic</th>
              <th className="text-right px-4 py-3">Receipts</th>
              <th className="text-right px-4 py-3">Conversion</th>
            </tr>
          </thead>
          <tbody>
            {sellerStats.map((s, idx) => (
              <tr key={s.email} className={`border-t text-sm ${idx < 3 ? `border-2 ${MEDAL_ROW[idx]} font-medium` : "border-slate-100"}`}>
                <td className="px-4 py-3">{idx < 3 ? <span className="text-lg">{MEDALS[idx]}</span> : idx + 1}</td>
                <td className="px-4 py-3">{s.displayName}</td>
                <td className="px-4 py-3 text-right">{Math.round(s.sales).toLocaleString("de-DE")}</td>
                <td className="px-4 py-3 text-right">{Math.round(s.core).toLocaleString("de-DE")}</td>
                <td className="px-4 py-3 text-right">{Math.round(s.accessories).toLocaleString("de-DE")}</td>
                <td className="px-4 py-3 text-right">{s.shifts}</td>
                <td className="px-4 py-3 text-right">{s.traffic}</td>
                <td className="px-4 py-3 text-right">{s.receipts}</td>
                <td className="px-4 py-3 text-right">{Math.round(s.conversionPct)}%</td>
              </tr>
            ))}
            {sellerStats.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-400">
                  No data for this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
