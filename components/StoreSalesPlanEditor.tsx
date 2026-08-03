"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";
import { getFiscalYearRange } from "@/lib/fiscalYear";

type PlanRow = { year: number; month: number; plan_amount_local: number };

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function StoreSalesPlanEditor({
  storeId,
  plans,
  currency,
  fxRate,
}: {
  storeId: string;
  plans: PlanRow[];
  currency: string;
  fxRate: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saved, setSaved] = useState<string | null>(null);

  const now = new Date();
  const { start: fyStart } = getFiscalYearRange(now);
  const months: { year: number; month: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(fyStart.getFullYear(), fyStart.getMonth() + i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const planMap = new Map(plans.map((p) => [`${p.year}-${p.month}`, p.plan_amount_local]));

  async function saveLocal(year: number, month: number, value: string) {
    const amount = Number(value.replace(/\./g, "").replace(",", ".")) || 0;
    await supabase.from("store_sales_plan").upsert({ store_id: storeId, year, month, plan_amount_local: amount }, { onConflict: "store_id,year,month" });
    setSaved(`${year}-${month}`);
    router.refresh();
    setTimeout(() => setSaved(null), 1500);
  }

  async function saveEur(year: number, month: number, value: string) {
    const eur = Number(value.replace(/\./g, "").replace(",", ".")) || 0;
    const local = round2(eur * fxRate);
    await supabase.from("store_sales_plan").upsert({ store_id: storeId, year, month, plan_amount_local: local }, { onConflict: "store_id,year,month" });
    setSaved(`${year}-${month}`);
    router.refresh();
    setTimeout(() => setSaved(null), 1500);
  }

  const fyTotalLocal = months.reduce((s, { year, month }) => s + (planMap.get(`${year}-${month}`) ?? 0), 0);
  const fyTotalEur = fxRate > 0 ? fyTotalLocal / fxRate : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">Month</th>
            <th className="text-right px-4 py-3">Plan ({currency})</th>
            <th className="text-right px-4 py-3">Plan (EUR)</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
            <td className="px-4 py-3">Total (FY)</td>
            <td className="px-4 py-3 text-right">{fyTotalLocal.toLocaleString("de-DE")}</td>
            <td className="px-4 py-3 text-right">{round2(fyTotalEur).toLocaleString("de-DE")}</td>
            <td className="px-4 py-3"></td>
          </tr>
          {months.map(({ year, month }) => {
            const key = `${year}-${month}`;
            const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
            const local = planMap.get(key) ?? 0;
            const eur = fxRate > 0 ? local / fxRate : 0;
            return (
              <tr key={key} className={`border-t border-slate-100 ${isCurrent ? "bg-amber-50" : ""}`}>
                <td className="px-4 py-3">
                  {MONTH_NAMES[month - 1]} {year} {isCurrent && <span className="text-xs text-amber-600">(current)</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="text"
                    inputMode="decimal"
                    defaultValue={local}
                    onBlur={(e) => saveLocal(year, month, e.target.value)}
                    className="w-28 px-2 py-1 border border-slate-200 rounded text-right"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="text"
                    inputMode="decimal"
                    defaultValue={round2(eur)}
                    onBlur={(e) => saveEur(year, month, e.target.value)}
                    className="w-28 px-2 py-1 border border-slate-200 rounded text-right"
                  />
                </td>
                <td className="px-4 py-3 text-right w-8">{saved === key && <Check size={14} className="inline text-emerald-600" />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
