"use client";

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#0EA5E9", "#EF4444", "#64748B"];

type TradeRow = { exporting_country: string; importing_country: string; product_group: string | null; flow: string; year: number; value: number | null };

export default function CountryImportChart({ countryName, rows }: { countryName: string; rows: TradeRow[] }) {
  const imports = rows.filter((r) => r.flow === "import" && r.importing_country === countryName);

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
    return { year, byGroup, total: Object.values(byGroup).reduce((s, v) => s + v, 0) };
  });

  const maxTotal = Math.max(...dataByYear.map((d) => d.total), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <h3 className="font-medium">Trade Overview</h3>
      <p className="text-xs text-slate-400 mb-4">Import from EU</p>

      {years.length === 0 ? (
        <p className="text-sm text-slate-400">No import data yet — upload trade data above to see this chart.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {groups.map((g, i) => (
              <span key={g} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {g}
              </span>
            ))}
          </div>
          <div className="flex items-end gap-3 h-56">
            {dataByYear.map((d) => (
              <div key={d.year} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                {d.total > 0 && <span className="text-[9px] text-slate-500">{Math.round(d.total).toLocaleString("de-DE")}</span>}
                <div className="w-8 sm:w-10 flex flex-col-reverse rounded-t overflow-hidden" style={{ height: `${(d.total / maxTotal) * 100}%` }}>
                  {groups.map((g, i) => {
                    const v = d.byGroup[g] ?? 0;
                    if (v <= 0) return null;
                    return <div key={g} style={{ height: `${(v / d.total) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} title={`${g}: ${Math.round(v).toLocaleString("de-DE")}`} />;
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
