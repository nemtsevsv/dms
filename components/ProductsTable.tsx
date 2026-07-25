"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  sku: string;
  product_name: string;
  brand: string | null;
  group_name: string | null;
  category: string | null;
  subgroup: string | null;
  list_price: number | null;
  dealer_price: number | null;
  retail_price_incl_vat: number | null;
};

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
      <option value="all">{label}: All</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export default function ProductsTable({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [group, setGroup] = useState("all");
  const [category, setCategory] = useState("all");
  const [subgroup, setSubgroup] = useState("all");

  const unique = (arr: (string | null)[]) => Array.from(new Set(arr.filter(Boolean))) as string[];
  const brands = useMemo(() => unique(products.map((p) => p.brand)), [products]);
  const groups = useMemo(() => unique(products.map((p) => p.group_name)), [products]);
  const categories = useMemo(() => unique(products.map((p) => p.category)), [products]);
  const subgroups = useMemo(() => unique(products.map((p) => p.subgroup)), [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products
      .filter((p) => p.sku.toLowerCase().includes(q) || p.product_name.toLowerCase().includes(q))
      .filter((p) => brand === "all" || p.brand === brand)
      .filter((p) => group === "all" || p.group_name === group)
      .filter((p) => category === "all" || p.category === category)
      .filter((p) => subgroup === "all" || p.subgroup === subgroup);
  }, [products, search, brand, group, category, subgroup]);

  function exportCsv() {
    const header = ["SKU", "Product Name", "Brand", "Group", "Category", "Sub-Category", "List Price", "Dealer Price", "Retail Price incl VAT"];
    const rows = filtered.map((p) => [
      p.sku,
      p.product_name,
      p.brand ?? "",
      p.group_name ?? "",
      p.category ?? "",
      p.subgroup ?? "",
      String(p.list_price ?? ""),
      String(p.dealer_price ?? ""),
      String(p.retail_price_incl_vat ?? ""),
    ]);
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
          placeholder="Search by SKU or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <FilterSelect label="Brand" value={brand} options={brands} onChange={setBrand} />
        <FilterSelect label="Group" value={group} options={groups} onChange={setGroup} />
        <FilterSelect label="Category" value={category} options={categories} onChange={setCategory} />
        <FilterSelect label="Sub-Category" value={subgroup} options={subgroups} onChange={setSubgroup} />
        <button onClick={exportCsv} className="sm:ml-auto px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
          Export to Excel/CSV
        </button>
        <Link href="/products/new" className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800">
          + New Product
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">SKU</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Brand</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-right px-4 py-3">List Price</th>
              <th className="text-right px-4 py-3">Retail incl. VAT</th>
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
                <td className="px-4 py-3 text-slate-500">{p.brand}</td>
                <td className="px-4 py-3 text-slate-500">{p.category}</td>
                <td className="px-4 py-3 text-right">{p.list_price?.toLocaleString("de-DE") ?? "—"}</td>
                <td className="px-4 py-3 text-right">{p.retail_price_incl_vat?.toLocaleString("de-DE") ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
