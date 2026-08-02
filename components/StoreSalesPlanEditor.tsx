"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";

type PlanRow = { year: number; month: number; plan_amount_local: number };

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function StoreSalesPlanEditor({ storeId, plans, currency }: { storeId: string; plans: PlanRow[]; currency: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [saved, setSaved] = useState<string | null>(null);

  const now = new Date();
  const months: { year: number; month: number }[] = [];
  for (let i = -2; i <= 9; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const planMap = new Map(plans.map((p) => [`${p.year}-${p.month}`, p.plan_amount_local]));

  async function savePlan(year: number, month: number, value: string) {
    const amount = Number(value.replace(/\./g, "").replace(",", ".")) || 0;
    await supabase.from("store_sales_plan").upsert({ store_id: storeId, year, month, plan_amount_local: amount }, { onConflict: "store_id,year,month" });
    setSaved(`${year}-${month}`);
    router.refresh();
    setTimeout(() => setSaved(null), 1500);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">Month</th>
            <th className="text-right px-4 py-3">Plan ({currency})</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {months.map(({ year, month }) => {
            const key = `${year}-${month}`;
            const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
            return (
              <tr key={key} className={`border-t border-slate-100 ${isCurrent ? "bg-amber-50" : ""}`}>
                <td className="px-4 py-3">
                  {MONTH_NAMES[month - 1]} {year} {isCurrent && <span className="text-xs text-amber-600">(current)</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="text"
                    inputMode="decimal"
                    defaultValue={planMap.get(key) ?? 0}
                    onBlur={(e) => savePlan(year, month, e.target.value)}
                    className="w-32 px-2 py-1 border border-slate-200 rounded text-right"
                  />
                </td>
                <td className="px-4 py-3 text-right w-16">{saved === key && <Check size={14} className="inline text-emerald-600" />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
