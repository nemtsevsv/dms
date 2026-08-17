"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ColumnFilterHeader from "./ColumnFilterHeader";
import ProductImport from "./ProductImport";
import { exportToXlsx } from "@/lib/exportXlsx";
import { btnPrimary, btnExport } from "@/lib/buttonStyles";
import { Download } from "lucide-react";

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
  customs_tariff_no: string | null;
  country_of_origin: string | null;
  gross_weight: number | null;
  net_weight: number | null;
  weight_unit: string | null;
  volume: number | null;
  volume_unit: string | null;
  dimensions: string | null;
};

type SortKey = "brand" | "group_name" | "category" | "subgroup" | "sku" | "product_name" | "list_price" | "retail_price_incl_vat";

function applyFilter(value: string, selected: string[]) {
  return selected.length === 0 || (selected.length === 1 && selected[0] === "__none__" ? false : selected.includes(value));
}

export default function ProductsTable({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [subgroupFilter, setSubgroupFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("product_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const unique = (arr: (string | null)[]) => Array.from(new Set(arr.filter(Boolean))) as string[];
  const brands = useMemo(() => unique(products.map((p) => p.brand)), [products]);
  const groups = useMemo(() => unique(products.map((p) => p.group_name)), [products]);
  const categories = useMemo(() => unique(products.map((p) => p.category)), [products]);
  const subgroups = useMemo(() => unique(products.map((p) => p.subgroup)), [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const dir = sortDir === "asc" ? 1 : -1;
    const numericKeys: SortKey[] = ["list_price", "retail_price_incl_vat"];
    return products
      .filter((p) => p.sku.toLowerCase().includes(q) || p.product_name.toLowerCase().includes(q))
      .filter((p) => applyFilter(p.brand ?? "", brandFilter))
      .filter((p) => applyFilter(p.group_name ?? "", groupFilter))
      .filter((p) => applyFilter(p.category ?? "", categoryFilter))
      .filter((p) => applyFilter(p.subgroup ?? "", subgroupFilter))
      .sort((a, b) => {
        if (numericKeys.includes(sortKey)) {
          return (((a[sortKey] as number) ?? 0) - ((b[sortKey] as number) ?? 0)) * dir;
        }
        return String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? "")) * dir;
      });
  }, [products, search, brandFilter, groupFilter, categoryFilter, subgroupFilter, sortKey, sortDir]);

  function handleSort(key: SortKey, dir: "asc" | "desc") {
    setSortKey(key);
    setSortDir(dir);
  }

  function exportXlsx() {
    const header = [
      "Brand", "Group", "Category", "Sub-Category", "Order-No.", "Name", "List Price", "Dealer Price", "Retail Price incl VAT",
      "Customs Tariff No.", "Country of Origin", "Gross Weight", "Net Weight", "Weight Unit", "Volume", "Volume Unit", "Dimensions",
    ];
    const rows = filtered.map((p) => [
      p.brand ?? "",
      p.group_name ?? "",
      p.category ?? "",
      p.subgroup ?? "",
      p.sku,
      p.product_name,
      p.list_price ?? "",
      p.dealer_price ?? "",
      p.retail_price_incl_vat ?? "",
      p.customs_tariff_no ?? "",
      p.country_of_origin ?? "",
      p.gross_weight ?? "",
      p.net_weight ?? "",
      p.weight_unit ?? "",
      p.volume ?? "",
      p.volume_unit ?? "",
      p.dimensions ?? "",
    ]);
    exportToXlsx("products.xlsx", header, rows, "Products");
  }

  const th = (key: SortKey, label: string, align: "left" | "right" = "left") => (
    <ColumnFilterHeader
      label={label}
      options={[]}
      selected={[]}
      onChange={() => {}}
      align={align}
      sortDir={sortKey === key ? sortDir : null}
      onSort={(dir) => handleSort(key, dir)}
    />
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          placeholder="Search by Order-No. or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <ProductImport />
        <button onClick={exportXlsx} className={btnExport}>
          <Download size={14} />
          Export
        </button>
        <Link href="/products/new" className={btnPrimary + " sm:ml-auto"}>
          + New Product
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-xs min-w-[1500px]">
          <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase">
            <tr>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Brand" options={brands} selected={brandFilter} onChange={setBrandFilter} sortDir={sortKey === "brand" ? sortDir : null} onSort={(dir) => handleSort("brand", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Group" options={groups} selected={groupFilter} onChange={setGroupFilter} sortDir={sortKey === "group_name" ? sortDir : null} onSort={(dir) => handleSort("group_name", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Category" options={categories} selected={categoryFilter} onChange={setCategoryFilter} sortDir={sortKey === "category" ? sortDir : null} onSort={(dir) => handleSort("category", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Sub-Category" options={subgroups} selected={subgroupFilter} onChange={setSubgroupFilter} sortDir={sortKey === "subgroup" ? sortDir : null} onSort={(dir) => handleSort("subgroup", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">{th("sku", "Order-No.")}</th>
              <th className="text-left px-3 py-2.5">{th("product_name", "Name")}</th>
              <th className="text-right px-3 py-2.5">{th("list_price", "List Price", "right")}</th>
              <th className="text-right px-3 py-2.5">{th("retail_price_incl_vat", "Retail incl. VAT", "right")}</th>
              <th className="text-left px-3 py-2.5">Customs Tariff No.</th>
              <th className="text-left px-3 py-2.5">Country of Origin</th>
              <th className="text-right px-3 py-2.5">Gross Weight</th>
              <th className="text-right px-3 py-2.5">Net Weight</th>
              <th className="text-left px-3 py-2.5">Weight Unit</th>
              <th className="text-right px-3 py-2.5">Volume</th>
              <th className="text-left px-3 py-2.5">Volume Unit</th>
              <th className="text-left px-3 py-2.5">Dimensions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-500">{p.brand}</td>
                <td className="px-3 py-2 text-slate-500">{p.group_name}</td>
                <td className="px-3 py-2 text-slate-500">{p.category}</td>
                <td className="px-3 py-2 text-slate-500">{p.subgroup}</td>
                <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{p.sku}</td>
                <td className="px-3 py-2">
                  <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                    {p.product_name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-right">{p.list_price?.toLocaleString("de-DE") ?? "—"}</td>
                <td className="px-3 py-2 text-right">{p.retail_price_incl_vat?.toLocaleString("de-DE") ?? "—"}</td>
                <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">{p.customs_tariff_no ?? "—"}</td>
                <td className="px-3 py-2 text-slate-500">{p.country_of_origin ?? "—"}</td>
                <td className="px-3 py-2 text-right text-slate-500">{p.gross_weight ?? "—"}</td>
                <td className="px-3 py-2 text-right text-slate-500">{p.net_weight ?? "—"}</td>
                <td className="px-3 py-2 text-slate-500">{p.weight_unit ?? "—"}</td>
                <td className="px-3 py-2 text-right text-slate-500">{p.volume ?? "—"}</td>
                <td className="px-3 py-2 text-slate-500">{p.volume_unit ?? "—"}</td>
                <td className="px-3 py-2 text-slate-500">{p.dimensions ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={16} className="text-center py-8 text-slate-400">
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
