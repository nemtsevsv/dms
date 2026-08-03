"use client";

import { useMemo, useState } from "react";

type StockRow = { sku: string; product_name: string | null; quantity: number; rsp: number; value: number };

export default function StoreInventoryTable({ stock, currency }: { stock: StockRow[]; currency: string }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return stock
      .filter((s) => s.quantity !== 0)
      .filter((s) => s.sku.toLowerCase().includes(q) || (s.product_name ?? "").toLowerCase().includes(q))
      .sort((a, b) => (a.product_name ?? "").localeCompare(b.product_name ?? ""));
  }, [stock, search]);

  const totalQty = filtered.reduce((s, r) => s + r.quantity, 0);
  const totalValue = filtered.reduce((s, r) => s + r.value, 0);

  return (
    <div>
      <input
        placeholder="Search by Order-No. or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-72 mb-3"
      />
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Order-No.</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-right px-4 py-3">In Stock</th>
              <th className="text-right px-4 py-3">RSP incl. VAT</th>
              <th className="text-right px-4 py-3">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
              <td className="px-4 py-3" colSpan={2}>
                Total
              </td>
              <td className="px-4 py-3 text-right">{totalQty}</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-right">
                {totalValue.toLocaleString("de-DE")} {currency}
              </td>
            </tr>
            {filtered.map((s) => (
              <tr key={s.sku} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.sku}</td>
                <td className="px-4 py-3">{s.product_name ?? "—"}</td>
                <td className={`px-4 py-3 text-right font-medium ${s.quantity <= 0 ? "text-red-600" : "text-slate-700"}`}>{s.quantity}</td>
                <td className="px-4 py-3 text-right text-slate-500">{s.rsp.toLocaleString("de-DE")}</td>
                <td className="px-4 py-3 text-right">
                  {s.value.toLocaleString("de-DE")} {currency}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  No stock recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
