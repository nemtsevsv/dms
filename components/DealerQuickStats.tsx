import { achievementColorClass } from "@/lib/achievementColor";

export default function DealerQuickStats({
  ordersCount,
  actualSales,
  achievementPct,
}: {
  ordersCount: number;
  actualSales: number;
  achievementPct: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <div className="text-[10px] uppercase text-slate-400">Total Orders</div>
        <div className="text-base font-semibold text-slate-900">{ordersCount}</div>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <div className="text-[10px] uppercase text-slate-400">Actual Sales (EUR)</div>
        <div className="text-base font-semibold text-emerald-600">{actualSales.toLocaleString("de-DE")}</div>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <div className="text-[10px] uppercase text-slate-400">Target Achievement</div>
        <div className={`text-base font-semibold ${achievementColorClass(achievementPct)}`}>{achievementPct}%</div>
      </div>
    </div>
  );
}
