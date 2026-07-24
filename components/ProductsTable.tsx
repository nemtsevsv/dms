"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  sku: string;
  product_name: string;
  category: string | null;
  dealer_price: number | null;
  retail_price: number | null;
};

export default function ProductsTable({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.sku.toLowerCase().includes(q) || p.product_name.toLowerCase().includes(q)
    );
  }, [products, search]);

  function exportCsv() {
    const header = ["SKU", "Product Name", "Category", "Dealer Price", "Retail Price"];
    const rows = filtered.map((p) => [p.sku, p.product_name, p.category ?? "", String(p.dealer_price ?? ""), String(p.retail_price ?? "")]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    a.click();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          placeholder="Поиск по SKU или названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <button onClick={exportCsv} className="ml-auto px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
          Экспорт в Excel/CSV
        </button>
        <Link href="/products/new" className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800">
          + Новый продукт
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">SKU</th>
              <th className="text-left px-4 py-3">Название</th>
              <th className="text-left px-4 py-3">Категория</th>
              <th className="text-right px-4 py-3">Цена дилера</th>
              <th className="text-right px-4 py-3">Розничная цена</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku}</td>
                <td className="px-4 py-3">
                  <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                    {p.product_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{p.category}</td>
                <td className="px-4 py-3 text-right">{p.dealer_price?.toLocaleString("de-DE") ?? "—"}</td>
                <td className="px-4 py-3 text-right">{p.retail_price?.toLocaleString("de-DE") ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  Продуктов не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
