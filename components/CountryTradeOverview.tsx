"use client";

import { useMemo, useState } from "react";
import MultiSelectDropdown from "./MultiSelectDropdown";

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

export default function CountryTradeOverview({ countryName, rows }: { countryName: string; rows: TradeRow[] }) {
  const [yearFilter, setYearFilter] = useState<string[]>([]);
  const [hsFilter, setHsFilter] = useState<string[]>([]);
  const [productFilter, setProductFilter] = useState<string[]>([]);
  const [flowFilter, setFlowFilter] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);

  const years = Array.from(new Set(rows.map((r) => String(r.year)))).sort().reverse();
  const hsCodes = Array.from(new Set(rows.map((r) => r.hs_code).filter(Boolean))) as string[];
  const products = Array.from(new Set(rows.map((r) => r.product).filter(Boolean))) as string[];
  const partnerCountries = Array.from(
    new Set(rows.map((r) => (r.exporting_country === countryName ? r.importing_country : r.exporting_country)))
  ).sort();

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const partner = r.exporting_country === countryName ? r.importing_country : r.exporting_country;
      if (yearFilter.length > 0 && !yearFilter.includes(String(r.year))) return false;
      if (hsFilter.length > 0 && !hsFilter.includes(r.hs_code ?? "")) return false;
      if (productFilter.length > 0 && !productFilter.includes(r.product ?? "")) return false;
      if (flowFilter.length > 0 && !flowFilter.includes(r.flow)) return false;
      if (countryFilter.length > 0 && !countryFilter.includes(partner)) return false;
      return true;
    });
  }, [rows, countryName, yearFilter, hsFilter, productFilter, flowFilter, countryFilter]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <MultiSelectDropdown label="Year" options={years} selected={yearFilter} onChange={setYearFilter} />
        <MultiSelectDropdown label="HS Code" options={hsCodes} selected={hsFilter} onChange={setHsFilter} />
        <MultiSelectDropdown label="Product" options={products} selected={productFilter} onChange={setProductFilter} />
        <MultiSelectDropdown label="Flow" options={["import", "export"]} selected={flowFilter} onChange={setFlowFilter} />
        <MultiSelectDropdown label="Country" options={partnerCountries} selected={countryFilter} onChange={setCountryFilter} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2.5">Year</th>
              <th className="text-left px-3 py-2.5">Flow</th>
              <th className="text-left px-3 py-2.5">Partner Country</th>
              <th className="text-left px-3 py-2.5">HS Code</th>
              <th className="text-left px-3 py-2.5">Product</th>
              <th className="text-right px-3 py-2.5">Quantity</th>
              <th className="text-right px-3 py-2.5">Value</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const partner = r.exporting_country === countryName ? r.importing_country : r.exporting_country;
              return (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-600">{r.year}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.flow === "export" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                      {r.flow}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{partner}</td>
                  <td className="px-3 py-2 text-slate-500 font-mono text-xs">{r.hs_code ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-600">{r.product ?? "—"}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{r.quantity !== null ? r.quantity.toLocaleString("de-DE") : "—"}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{r.value !== null ? r.value.toLocaleString("de-DE") : "—"}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No trade data yet — upload a file above
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
