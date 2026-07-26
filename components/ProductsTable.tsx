"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ColumnFilterHeader from "./ColumnFilterHeader";
import ProductImport from "./ProductImport";

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

function applyFilter(value: string, selected: string[]) {
  return selected.length === 0 || (selected.length === 1 && selected[0] === "__none__" ? false : selected.includes(value));
}

export default function ProductsTable({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [subgroupFilter, setSubgroupFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<"product_name" | "list_price" | "retail_price_incl_vat">("product_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const unique = (arr: (string | null)[]) => Array.from(new Set(arr.filter(Boolean))) as string[];
  const brands = useMemo(() => unique(products.map((p) => p.brand)), [products]);
  const groups = useMemo(() => unique(products.map((p) => p.group_name)), [products]);
  const categories = useMemo(() => unique(products.map((p) => p.category)), [products]);
  const subgroups = useMemo(() => unique(products.map((p) => p.subgroup)), [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products
      .filter((p) => p.sku.toLowerCase().includes(q) || p.product_name.toLowerCase().includes(q))
      .filter((p) => applyFilter(p.brand ?? "", brandFilter))
      .filter((p) => applyFilter(p.group_name ?? "", groupFilter))
      .filter((p) => applyFilter(p.category ?? "", categoryFilter))
      .filter((p) => applyFilter(p.subgroup ?? "", subgroupFilter))
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "list_price") return ((a.list_price ?? 0) - (b.list_price ?? 0)) * dir;
        if (sortKey === "retail_price_incl_vat") return ((a.retail_price_incl_vat ?? 0) - (b.retail_price_incl_vat ?? 0)) * dir;
        return a.product_name.localeCompare(b.product_name) * dir;
      });
  }, [products, search, brandFilter, groupFilter, categoryFilter, subgroupFilter, sortKey, sortDir]);

  function handleSort(key: typeof sortKey, dir: "asc" | "desc") {
    setSortKey(key);
    setSortDir(dir);
  }

  function exportCsv() {
    const header = ["Brand", "Group", "Category", "Sub-Category", "SKU", "Name", "List Price", "Dealer Price", "Retail Price incl VAT"];
    const rows = filtered.map((p) => [
      p.brand ?? "",
      p.group_name ?? "",
      p.category ?? "",
      p.subgroup ?? "",
      p.sku,
      p.product_name,
      String(p.list_price ?? ""),
      String(p.dealer_price ?? ""),
      String(p.retail_price_incl_vat ?? ""),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    a.click();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          placeholder="Search by SKU or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <ProductImport />
        <button onClick={exportCsv} className="px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
          Export
        </button>
        <Link href="/products/new" className="sm:ml-auto px-3 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800">
          + New Product
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-3">
                <ColumnFilterHeader label="Brand" options={brands} selected={brandFilter} onChange={setBrandFilter} />
              </th>
              <th className="text-left px-3 py-3">
                <ColumnFilterHeader label="Group" options={groups} selected={groupFilter} onChange={setGroupFilter} />
              </th>
              <th className="text-left px-3 py-3">
                <ColumnFilterHeader label="Category" options={categories} selected={categoryFilter} onChange={setCategoryFilter} />
              </th>
              <th className="text-left px-3 py-3">
                <ColumnFilterHeader label="Sub-Category" options={subgroups} selected={subgroupFilter} onChange={setSubgroupFilter} />
              </th>
              <th className="text-left px-3 py-3">SKU</th>
              <th className="text-left px-3 py-3">
                <ColumnFilterHeader
                  label="Name"
                  options={[]}
                  selected={[]}
                  onChange={() => {}}
                  sortDir={sortKey === "product_name" ? sortDir : null}
                  onSort={(dir) => handleSort("product_name", dir)}
                />
              </th>
              <th className="text-right px-3 py-3">
                <ColumnFilterHeader
                  label="List Price"
                  options={[]}
                  selected={[]}
                  onChange={() => {}}
                  align="right"
                  sortDir={sortKey === "list_price" ? sortDir : null}
                  onSort={(dir) => handleSort("list_price", dir)}
                />
              </th>
              <th className="text-right px-3 py-3">
                <ColumnFilterHeader
                  label="Retail incl. VAT"
                  options={[]}
                  selected={[]}
                  onChange={() => {}}
                  align="right"
                  sortDir={sortKey === "retail_price_incl_vat" ? sortDir : null}
                  onSort={(dir) => handleSort("retail_price_incl_vat", dir)}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-3 text-slate-500">{p.brand}</td>
                <td className="px-3 py-3 text-slate-500">{p.group_name}</td>
                <td className="px-3 py-3 text-slate-500">{p.category}</td>
                <td className="px-3 py-3 text-slate-500">{p.subgroup}</td>
                <td className="px-3 py-3 font-mono text-xs text-slate-500">{p.sku}</td>
                <td className="px-3 py-3">
                  <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                    {p.product_name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-right">{p.list_price?.toLocaleString("de-DE") ?? "—"}</td>
                <td className="px-3 py-3 text-right">{p.retail_price_incl_vat?.toLocaleString("de-DE") ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400">
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
