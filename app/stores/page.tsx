import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import { btnPrimary } from "@/lib/buttonStyles";
import { getFiscalYearRange } from "@/lib/fiscalYear";
import { achievementColorClass } from "@/lib/achievementColor";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const supabase = createClient();
  const { data: stores } = await supabase.from("stores").select("*").order("name");

  const { start: fyStart, end: fyEnd } = getFiscalYearRange();
  const fyStartStr = fyStart.toISOString().slice(0, 10);
  const fyEndStr = fyEnd.toISOString().slice(0, 10);
  const fyStartMonth = fyStart.getFullYear() * 12 + fyStart.getMonth();

  const storeIds = (stores ?? []).map((s) => s.id);
  const [{ data: plans }, { data: receipts }] = await Promise.all([
    storeIds.length > 0 ? supabase.from("store_sales_plan").select("store_id, year, month, plan_amount_local").in("store_id", storeIds) : Promise.resolve({ data: [] as any[] }),
    storeIds.length > 0
      ? supabase.from("store_receipts").select("store_id, occurred_at, store_receipt_items(total)").in("store_id", storeIds).gte("occurred_at", `${fyStartStr}T00:00:00Z`).lte("occurred_at", `${fyEndStr}T23:59:59Z`)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const planByStore = new Map<string, number>();
  for (const p of plans ?? []) {
    const monthIndex = p.year * 12 + (p.month - 1);
    if (monthIndex < fyStartMonth || monthIndex >= fyStartMonth + 12) continue;
    planByStore.set(p.store_id, (planByStore.get(p.store_id) ?? 0) + (Number(p.plan_amount_local) || 0));
  }
  const salesByStore = new Map<string, number>();
  for (const r of receipts ?? []) {
    const sum = (r.store_receipt_items ?? []).reduce((s: number, it: any) => s + (Number(it.total) || 0), 0);
    salesByStore.set(r.store_id, (salesByStore.get(r.store_id) ?? 0) + sum);
  }
  const fxRateByStore = new Map((stores ?? []).map((s) => [s.id, s.fx_rate_to_eur || 1]));

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Stores</h1>
        <Link href="/stores/new" className={btnPrimary}>
          + New Store
        </Link>
      </div>
      <p className="text-xs text-slate-400 mb-3">Plan / Actual Sales shown in EUR, converted at each store's exchange rate.</p>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[750px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Store</th>
              <th className="text-left px-4 py-3">Country</th>
              <th className="text-left px-4 py-3">City</th>
              <th className="text-left px-4 py-3">Currency</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Plan (EUR)</th>
              <th className="text-right px-4 py-3">Actual Sales (EUR)</th>
              <th className="text-right px-4 py-3">Achievement</th>
            </tr>
          </thead>
          <tbody>
            {(stores ?? []).map((s) => {
              const fxRate = fxRateByStore.get(s.id) || 1;
              const plan = (planByStore.get(s.id) ?? 0) / fxRate;
              const actual = (salesByStore.get(s.id) ?? 0) / fxRate;
              const pct = plan > 0 ? Math.round((actual / plan) * 100) : 0;
              return (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/stores/${s.id}`} className="font-medium hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.country}</td>
                  <td className="px-4 py-3 text-slate-500">{s.city}</td>
                  <td className="px-4 py-3 text-slate-500">{s.currency}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{plan.toLocaleString("de-DE")}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{actual.toLocaleString("de-DE")}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${achievementColorClass(pct)}`}>{plan > 0 ? `${pct}%` : "—"}</td>
                </tr>
              );
            })}
            {(stores ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400">
                  No stores yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
