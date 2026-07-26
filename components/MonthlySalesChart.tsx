"use client";

type MonthData = { label: string; ordered: number; invoiced: number };

export default function MonthlySalesChart({ data }: { data: MonthData[] }) {
  const max = Math.max(...data.map((d) => Math.max(d.ordered, d.invoiced)), 1);

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" /> Ordered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Invoiced
        </span>
      </div>
      <div className="flex items-end gap-2 h-40">
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div className="flex items-end gap-0.5 h-full w-full justify-center">
              <div
                className="w-2.5 sm:w-3 bg-slate-300 rounded-t"
                style={{ height: `${(d.ordered / max) * 100}%` }}
                title={`Ordered: ${Math.round(d.ordered).toLocaleString("de-DE")}`}
              />
              <div
                className="w-2.5 sm:w-3 bg-emerald-500 rounded-t"
                style={{ height: `${(d.invoiced / max) * 100}%` }}
                title={`Invoiced: ${Math.round(d.invoiced).toLocaleString("de-DE")}`}
              />
            </div>
            <span className="text-[10px] text-slate-400">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
