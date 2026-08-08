"use client";

import { useMemo, useState } from "react";
import { isEuCountry } from "@/lib/euCountries";

type Country = { population: number | null; gdp: number | null; hnwi: number | null };
type TradeRow = { exporting_country: string; importing_country: string; flow: string; hs_code: string | null; value: number | null };

function fmt(n: number) {
  return Math.round(n).toLocaleString("de-DE");
}

export default function CountriesOverviewWidgets({ countries, tradeRows }: { countries: Country[]; tradeRows: TradeRow[] }) {
  const [hsFilter, setHsFilter] = useState<string>("all");

  const totalPopulation = countries.reduce((s, c) => s + (c.population ?? 0), 0);
  const totalHnwi = countries.reduce((s, c) => s + (c.hnwi ?? 0), 0);
  const totalGdpMio = countries.reduce((s, c) => s + (c.gdp ?? 0), 0) / 1_000_000;

  const euImportRows = useMemo(() => tradeRows.filter((r) => r.flow === "import" && isEuCountry(r.exporting_country)), [tradeRows]);
  const hsCodes = useMemo(() => Array.from(new Set(euImportRows.map((r) => r.hs_code).filter(Boolean))).sort() as string[], [euImportRows]);
  const totalEuImport = useMemo(
    () => euImportRows.filter((r) => hsFilter === "all" || r.hs_code === hsFilter).reduce((s, r) => s + (Number(r.value) || 0), 0),
    [euImportRows, hsFilter]
  );

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
          <span className="text-xs text-slate-400">Total EU Import</span>
          <select
            value={hsFilter}
            onChange={(e) => setHsFilter(e.target.value)}
            className="text-[10px] border border-slate-200 rounded px-1 py-0.5 max-w-[70px]"
            title="Filter by HS code"
          >
            <option value="all">All HS</option>
            {hsCodes.map((hs) => (
              <option key={hs} value={hs}>
                {hs}
              </option>
            ))}
          </select>
        </div>
        <div className="text-lg font-semibold text-slate-800">{fmt(totalEuImport)}</div>
      </div>
    </div>
  );
}
