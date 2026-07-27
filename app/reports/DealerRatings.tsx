"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { achievementColorClass } from "@/lib/achievementColor";

type DealerRow = {
  id: string;
  company_name: string;
  country: string;
  annual_sales_plan: number;
  actual_sales: number;
};

const medal = ["🥇", "🥈", "🥉"];
const medalRowStyle = [
  "bg-amber-50 border-amber-300",
  "bg-slate-50 border-slate-300",
  "bg-orange-50 border-orange-200",
];

export default function DealerRatings({ dealers }: { dealers: DealerRow[] }) {
  const [sortBy, setSortBy] = useState<"achievement" | "actual_sales">("achievement");

  function achievementPct(d: DealerRow) {
    return d.annual_sales_plan ? Math.round((d.actual_sales / d.annual_sales_plan) * 100) : 0;
  }

  const sorted = useMemo(() => {
    return [...dealers].sort((a, b) => {
      if (sortBy === "actual_sales") return b.actual_sales - a.actual_sales;
      return achievementPct(b) - achievementPct(a);
    });
  }, [dealers, sortBy]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-slate-500">Rank by:</span>
        <button
          onClick={() => setSortBy("achievement")}
          className={`px-3 py-1.5 rounded-lg text-sm border ${sortBy === "achievement" ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 hover:bg-slate-50"}`}
        >
          Target Achievement
        </button>
        <button
          onClick={() => setSortBy("actual_sales")}
          className={`px-3 py-1.5 rounded-lg text-sm border ${sortBy === "actual_sales" ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 hover:bg-slate-50"}`}
        >
          Actual Sales
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Dealer</th>
              <th className="text-left px-4 py-3">Country</th>
              <th className="text-right px-4 py-3">Actual Sales (EUR)</th>
              <th className="text-right px-4 py-3">Target Achievement</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, idx) => (
              <tr
                key={d.id}
                className={`border-t text-sm ${idx < 3 ? `border-2 ${medalRowStyle[idx]} font-medium` : "border-slate-100 hover:bg-slate-50"}`}
              >
                <td className="px-4 py-3">{idx < 3 ? <span className="text-lg">{medal[idx]}</span> : idx + 1}</td>
                <td className="px-4 py-3">
                  <Link href={`/dealers/${d.id}`} className="hover:underline">
                    {d.company_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{d.country}</td>
                <td className="px-4 py-3 text-right">{d.actual_sales.toLocaleString("de-DE")}</td>
                <td className={`px-4 py-3 text-right font-semibold ${achievementColorClass(achievementPct(d))}`}>{achievementPct(d)}%</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  No active dealers with sales data yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
