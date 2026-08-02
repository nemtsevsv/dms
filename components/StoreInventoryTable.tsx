"use client";

import { useMemo, useState } from "react";

type StockRow = { sku: string; product_name: string | null; quantity: number };

export default function StoreInventoryTable({ stock }: { stock: StockRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return stock
      .filter((s) => s.quantity !== 0)
      .filter((s) => s.sku.toLowerCase().includes(q) || (s.product_name ?? "").toLowerCase().includes(q))
      .sort((a, b) => (a.product_name ?? "").localeCompare(b.product_name ?? ""));
  }, [stock, search]);

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
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.sku} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.sku}</td>
                <td className="px-4 py-3">{s.product_name ?? "—"}</td>
                <td className={`px-4 py-3 text-right font-medium ${s.quantity <= 0 ? "text-red-600" : "text-slate-700"}`}>{s.quantity}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-slate-400">
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
