import Link from "next/link";
import { achievementColorClass } from "@/lib/achievementColor";

type StoreRow = {
  id: string;
  name: string;
  country: string;
  currency: string;
  planThisMonth: number;
  actualThisMonth: number;
  actualLastMonth: number;
};

export default function RetailPerformanceReport({ stores }: { stores: StoreRow[] }) {
  function achievementPct(s: StoreRow) {
    return s.planThisMonth > 0 ? Math.round((s.actualThisMonth / s.planThisMonth) * 100) : 0;
  }
  function momDelta(s: StoreRow) {
    if (s.actualLastMonth === 0) return s.actualThisMonth > 0 ? "+100%" : "0%";
    const pct = Math.round(((s.actualThisMonth - s.actualLastMonth) / s.actualLastMonth) * 100);
    return `${pct >= 0 ? "+" : ""}${pct}%`;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
      <table className="w-full text-sm min-w-[650px]">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">Store</th>
            <th className="text-left px-4 py-3">Country</th>
            <th className="text-right px-4 py-3">Plan (this month)</th>
            <th className="text-right px-4 py-3">Actual (this month)</th>
            <th className="text-right px-4 py-3">Achievement</th>
            <th className="text-right px-4 py-3">vs Last Month</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((s) => (
            <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link href={`/stores/${s.id}`} className="font-medium hover:underline">
                  {s.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-500">{s.country}</td>
              <td className="px-4 py-3 text-right">
                {s.planThisMonth.toLocaleString("de-DE")} {s.currency}
              </td>
              <td className="px-4 py-3 text-right">
                {s.actualThisMonth.toLocaleString("de-DE")} {s.currency}
              </td>
              <td className={`px-4 py-3 text-right font-semibold ${achievementColorClass(achievementPct(s))}`}>{achievementPct(s)}%</td>
              <td className="px-4 py-3 text-right text-slate-500">{momDelta(s)}</td>
            </tr>
          ))}
          {stores.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-8 text-slate-400">
                No stores yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
