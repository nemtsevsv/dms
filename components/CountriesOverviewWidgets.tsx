"use client";

import { useMemo, useState } from "react";
import { isEuCountry } from "@/lib/euCountries";

type Country = { population: number | null; gdp: number | null; hnwi: number | null };
type TradeRow = { exporting_country: string; importing_country: string; flow: string; product_group: string | null; year: number; value: number | null };

function fmt(n: number) {
  return Math.round(n).toLocaleString("de-DE");
}

export default function CountriesOverviewWidgets({ countries, tradeRows }: { countries: Country[]; tradeRows: TradeRow[] }) {
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const totalPopulation = countries.reduce((s, c) => s + (c.population ?? 0), 0);
  const totalHnwi = countries.reduce((s, c) => s + (c.hnwi ?? 0), 0);
  const totalGdpMio = countries.reduce((s, c) => s + (c.gdp ?? 0), 0) / 1_000_000;

  const euImportRows = useMemo(() => tradeRows.filter((r) => r.flow === "import" && isEuCountry(r.exporting_country)), [tradeRows]);
  const productGroups = useMemo(() => Array.from(new Set(euImportRows.map((r) => r.product_group).filter(Boolean))).sort() as string[], [euImportRows]);
  const years = useMemo(() => Array.from(new Set(euImportRows.map((r) => r.year))).sort((a, b) => b - a), [euImportRows]);

  const totalEuImportMio = useMemo(() => {
    const filtered = euImportRows.filter(
      (r) => (groupFilter === "all" || r.product_group === groupFilter) && (yearFilter === "all" || String(r.year) === yearFilter)
    );
    return filtered.reduce((s, r) => s + (Number(r.value) || 0), 0) / 1_000_000;
  }, [euImportRows, groupFilter, yearFilter]);

  const widgets = [
    { label: "Total Countries", value: countries.length.toLocaleString("de-DE") },
    { label: "Total Population", value: fmt(totalPopulation) },
    { label: "Total HNWI", value: fmt(totalHnwi) },
    { label: "Total GDP, mio USD", value: fmt(totalGdpMio) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {widgets.map((w) => (
        <div key={w.label} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
          <div className="text-xs text-slate-400 mb-1">{w.label}</div>
          <div className="text-lg font-semibold text-slate-800">{w.value}</div>
        </div>
      ))}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-xs text-slate-400">Total EU Import, mio EUR</span>
        </div>
        <div className="text-lg font-semibold text-slate-800 mb-1.5">{fmt(totalEuImportMio)}</div>
        <div className="flex items-center gap-1">
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="text-[10px] border border-slate-200 rounded px-1 py-0.5 flex-1 min-w-0"
            title="Filter by product group"
          >
            <option value="all">All groups</option>
            {productGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="text-[10px] border border-slate-200 rounded px-1 py-0.5 w-16 shrink-0"
            title="Filter by year"
          >
            <option value="all">All yrs</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
