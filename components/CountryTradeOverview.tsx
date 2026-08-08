"use client";

import { useMemo, useState } from "react";
import ColumnFilterHeader from "./ColumnFilterHeader";
import TradeDataImport from "./TradeDataImport";
import ClearTradeDataButton from "./ClearTradeDataButton";

type TradeRow = {
  id: string;
  exporting_country: string;
  importing_country: string;
  product_group: string | null;
  product: string | null;
  hs_code: string | null;
  flow: string;
  year: number;
  quantity: number | null;
  value: number | null;
};

type SortKey = "year" | "flow" | "partner" | "hs_code" | "product" | "quantity" | "value";

export default function CountryTradeOverview({ countryName, rows }: { countryName: string; rows: TradeRow[] }) {
  const [yearFilter, setYearFilter] = useState<string[]>([]);
  const [hsFilter, setHsFilter] = useState<string[]>([]);
  const [productFilter, setProductFilter] = useState<string[]>([]);
  const [flowFilter, setFlowFilter] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("year");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const years = Array.from(new Set(rows.map((r) => String(r.year)))).sort().reverse();
  const hsCodes = Array.from(new Set(rows.map((r) => r.hs_code).filter(Boolean))) as string[];
  const products = Array.from(new Set(rows.map((r) => r.product).filter(Boolean))) as string[];
  const partnerCountries = Array.from(
    new Set(rows.map((r) => (r.exporting_country === countryName ? r.importing_country : r.exporting_country)))
  ).sort();

  function handleSort(key: SortKey, dir: "asc" | "desc") {
    setSortKey(key);
    setSortDir(dir);
  }

  const withPartner = useMemo(
    () => rows.map((r) => ({ ...r, partner: r.exporting_country === countryName ? r.importing_country : r.exporting_country })),
    [rows, countryName]
  );

  const filtered = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return withPartner
      .filter((r) => {
        if (yearFilter.length > 0 && !yearFilter.includes(String(r.year))) return false;
        if (hsFilter.length > 0 && !hsFilter.includes(r.hs_code ?? "")) return false;
        if (productFilter.length > 0 && !productFilter.includes(r.product ?? "")) return false;
        if (flowFilter.length > 0 && !flowFilter.includes(r.flow)) return false;
        if (countryFilter.length > 0 && !countryFilter.includes(r.partner)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortKey === "year") return (a.year - b.year) * dir;
        if (sortKey === "flow") return a.flow.localeCompare(b.flow) * dir;
        if (sortKey === "partner") return a.partner.localeCompare(b.partner) * dir;
        if (sortKey === "hs_code") return (a.hs_code ?? "").localeCompare(b.hs_code ?? "") * dir;
        if (sortKey === "product") return (a.product ?? "").localeCompare(b.product ?? "") * dir;
        if (sortKey === "quantity") return ((a.quantity ?? 0) - (b.quantity ?? 0)) * dir;
        if (sortKey === "value") return ((a.value ?? 0) - (b.value ?? 0)) * dir;
        return 0;
      });
  }, [withPartner, yearFilter, hsFilter, productFilter, flowFilter, countryFilter, sortKey, sortDir]);

  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h3 className="font-medium text-sm">Trade Data (Export/Import)</h3>
          {rows.length > 0 && <ClearTradeDataButton countryName={countryName} />}
        </div>
        <p className="text-xs text-slate-400 mb-3">Upload a file to add trade records for {countryName} — rows where it appears as either the exporting or importing country.</p>
        <TradeDataImport />
      </div>

      {/* Table wrapper keeps a minimum height so an open column filter
          dropdown always has room, even when filtering leaves zero rows. */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm min-h-[220px]">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Year" options={years} selected={yearFilter} onChange={setYearFilter} sortDir={sortKey === "year" ? sortDir : null} onSort={(dir) => handleSort("year", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Flow" options={["import", "export"]} selected={flowFilter} onChange={setFlowFilter} sortDir={sortKey === "flow" ? sortDir : null} onSort={(dir) => handleSort("flow", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Partner Country" options={partnerCountries} selected={countryFilter} onChange={setCountryFilter} sortDir={sortKey === "partner" ? sortDir : null} onSort={(dir) => handleSort("partner", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="HS Code" options={hsCodes} selected={hsFilter} onChange={setHsFilter} sortDir={sortKey === "hs_code" ? sortDir : null} onSort={(dir) => handleSort("hs_code", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Product" options={products} selected={productFilter} onChange={setProductFilter} sortDir={sortKey === "product" ? sortDir : null} onSort={(dir) => handleSort("product", dir)} />
              </th>
              <th className="text-right px-3 py-2.5">
                <ColumnFilterHeader label="Quantity" options={[]} selected={[]} onChange={() => {}} align="right" sortDir={sortKey === "quantity" ? sortDir : null} onSort={(dir) => handleSort("quantity", dir)} />
              </th>
              <th className="text-right px-3 py-2.5">
                <ColumnFilterHeader label="Value" options={[]} selected={[]} onChange={() => {}} align="right" sortDir={sortKey === "value" ? sortDir : null} onSort={(dir) => handleSort("value", dir)} />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-600">{r.year}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.flow === "export" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                    {r.flow}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600">{r.partner}</td>
                <td className="px-3 py-2 text-slate-500 font-mono text-xs">{r.hs_code ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600">{r.product ?? "—"}</td>
                <td className="px-3 py-2 text-right text-slate-600">{r.quantity !== null ? r.quantity.toLocaleString("de-DE") : "—"}</td>
                <td className="px-3 py-2 text-right text-slate-700">{r.value !== null ? r.value.toLocaleString("de-DE") : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No trade data matches the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
