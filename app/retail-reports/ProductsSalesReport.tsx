"use client";

import { useMemo, useState } from "react";
import { exportToXlsx } from "@/lib/exportXlsx";
import { Download } from "lucide-react";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ProductsSalesReport({ bundle, storeIds }: { bundle: any; storeIds: string[] }) {
  const stores = bundle.stores.filter((s: any) => storeIds.includes(s.id));
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const store = stores.find((s: any) => s.id === storeId);
  const localCurrency = store?.currency ?? "EUR";
  const fxRate = store?.fxRate ?? 1;
  const [currency, setCurrency] = useState<"local" | "EUR">("local");
  const rate = currency === "EUR" ? fxRate : 1;
  const displayCurrency = currency === "EUR" ? "EUR" : localCurrency;

  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const r of bundle.receipts) if (r.storeId === storeId) keys.add(r.date.slice(0, 7));
    for (const p of bundle.plans) if (p.storeId === storeId) keys.add(`${p.year}-${String(p.month).padStart(2, "0")}`);
    return Array.from(keys).sort();
  }, [bundle, storeId]);

  const activeMonths = selectedMonths.length === 0 ? monthOptions : selectedMonths;

  const filteredReceipts = useMemo(
    () => bundle.receipts.filter((r: any) => r.storeId === storeId && activeMonths.includes(r.date.slice(0, 7))),
    [bundle, storeId, activeMonths]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, { total: number; core: number; accessories: number; items: { sku: string; product: string }[] }>();
    for (const r of filteredReceipts) {
      const entry = map.get(r.date) ?? { total: 0, core: 0, accessories: 0, items: [] };
      for (const it of r.items) {
        entry.total += it.total;
        if (it.itemType === "core") entry.core += it.total;
        else entry.accessories += it.total;
        entry.items.push({ sku: it.sku ?? "", product: it.productName ?? "" });
      }
      map.set(r.date, entry);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredReceipts]);

  const totalSales = byDate.reduce((s, [, v]) => s + v.total, 0) / rate;
  const totalPlan = useMemo(() => {
    return bundle.plans
      .filter((p: any) => p.storeId === storeId && activeMonths.includes(`${p.year}-${String(p.month).padStart(2, "0")}`))
      .reduce((s: number, p: any) => s + p.planLocal, 0) / rate;
  }, [bundle, storeId, activeMonths, rate]);
  const achievementPct = totalPlan > 0 ? Math.round((totalSales / totalPlan) * 100) : 0;

  function handleExport() {
    const header = ["Date", `Total Sales (${displayCurrency})`, `Core Items (${displayCurrency})`, `Accessories (${displayCurrency})`, "Items (Order-No. / Product)"];
    const rows = byDate.map(([date, v]) => [
      date,
      Math.round(v.total / rate),
      Math.round(v.core / rate),
      Math.round(v.accessories / rate),
      v.items.map((i) => `${i.sku} ${i.product}`).join("; "),
    ]);
    exportToXlsx(`products-sales-report-${store?.name ?? "store"}`, header, rows);
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
        <MultiSelectDropdown label="Months" options={monthOptions} selected={selectedMonths} onChange={setSelectedMonths} />
        <select value={currency} onChange={(e) => setCurrency(e.target.value as "local" | "EUR")} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option value="local">{localCurrency}</option>
          <option value="EUR">EUR</option>
        </select>
        <button onClick={handleExport} className="ml-auto flex items-center gap-2 px-3 py-2 border border-emerald-300 text-emerald-700 rounded-lg text-sm hover:bg-emerald-50">
          <Download size={14} />
          Export to Excel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Total Sales</div>
          <div className="text-2xl font-semibold">
            {Math.round(totalSales).toLocaleString("de-DE")} {displayCurrency}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Plan</div>
          <div className="text-2xl font-semibold">
            {Math.round(totalPlan).toLocaleString("de-DE")} {displayCurrency}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Target Achievement</div>
          <div className="text-2xl font-semibold">{achievementPct}%</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-right px-4 py-3">Total Sales</th>
              <th className="text-right px-4 py-3">Core Items</th>
              <th className="text-right px-4 py-3">Accessories</th>
              <th className="text-left px-4 py-3">Items Sold</th>
            </tr>
          </thead>
          <tbody>
            {byDate.map(([date, v]) => (
              <tr key={date} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-500">{date}</td>
                <td className="px-4 py-3 text-right font-medium">{Math.round(v.total / rate).toLocaleString("de-DE")}</td>
                <td className="px-4 py-3 text-right">{Math.round(v.core / rate).toLocaleString("de-DE")}</td>
                <td className="px-4 py-3 text-right">{Math.round(v.accessories / rate).toLocaleString("de-DE")}</td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">
                  {v.items.map((i, idx) => (
                    <span key={idx}>
                      {idx > 0 && "; "}
                      <span className="font-mono">{i.sku}</span> {i.product}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
            {byDate.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  No sales in this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
