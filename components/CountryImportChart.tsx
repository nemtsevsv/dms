"use client";

import { useMemo, useState } from "react";
import MultiSelectDropdown from "./MultiSelectDropdown";

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#0EA5E9", "#EF4444", "#64748B"];

type TradeRow = { exporting_country: string; importing_country: string; product_group: string | null; flow: string; year: number; value: number | null };

export default function CountryImportChart({ countryName, rows }: { countryName: string; rows: TradeRow[] }) {
  const allImports = rows.filter((r) => r.flow === "import" && r.importing_country === countryName);
  const originCountries = Array.from(new Set(allImports.map((r) => r.exporting_country))).sort();

  const [originFilter, setOriginFilter] = useState<string[]>([]);

  const imports = useMemo(
    () => allImports.filter((r) => originFilter.length === 0 || originFilter.includes(r.exporting_country)),
    [allImports, originFilter]
  );

  const years = Array.from(new Set(imports.map((r) => r.year))).sort();
  const groups = Array.from(new Set(imports.map((r) => r.product_group || "Other")));

  const dataByYear = years.map((year) => {
    const byGroup: Record<string, number> = {};
    for (const g of groups) byGroup[g] = 0;
    for (const r of imports) {
      if (r.year !== year) continue;
      const g = r.product_group || "Other";
      byGroup[g] = (byGroup[g] ?? 0) + (Number(r.value) || 0);
    }
    return { year, byGroup };
  });

  const maxValue = Math.max(...dataByYear.flatMap((d) => Object.values(d.byGroup)), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <div>
          <h3 className="font-medium">Trade Overview</h3>
          <p className="text-xs text-slate-400">Import from EU</p>
        </div>
        <MultiSelectDropdown label="Origin Country" options={originCountries} selected={originFilter} onChange={setOriginFilter} />
      </div>

      {years.length === 0 ? (
        <p className="text-sm text-slate-400 mt-4">No import data yet — upload trade data below to see this chart.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-3 mt-3">
            {groups.map((g, i) => (
              <span key={g} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {g}
              </span>
            ))}
          </div>
          <div className="flex items-end gap-4 h-56 overflow-x-auto">
            {dataByYear.map((d) => (
              <div key={d.year} className="flex flex-col items-center gap-1 h-full justify-end shrink-0">
                <div className="flex items-end gap-1 h-full">
                  {groups.map((g, i) => {
                    const v = d.byGroup[g] ?? 0;
                    return (
                      <div key={g} className="flex flex-col items-center justify-end h-full">
                        {v > 0 && <span className="text-[8px] text-slate-500 whitespace-nowrap">{Math.round(v).toLocaleString("de-DE")}</span>}
                        <div
                          className="w-3.5 sm:w-4 rounded-t"
                          style={{ height: `${(v / maxValue) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                          title={`${g}: ${Math.round(v).toLocaleString("de-DE")}`}
                        />
                      </div>
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-400">{d.year}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
