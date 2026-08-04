import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import KpiCard from "@/components/KpiCard";
import ConversionFunnel from "@/components/ConversionFunnel";
import MonthlySalesChart from "@/components/MonthlySalesChart";
import Link from "next/link";
import { format, isToday, isPast } from "date-fns";
import { getCurrentFiscalYearBounds, getFiscalYearRange } from "@/lib/fiscalYear";
import { computeItemStatus } from "@/lib/orderItemStatus";
import { achievementColorClass } from "@/lib/achievementColor";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const { startStr, endStr, label } = getCurrentFiscalYearBounds();
  const { start: fyStart } = getFiscalYearRange();

  const [{ data: dealers }, { data: tasks }, { data: orders }, { data: invoices }] = await Promise.all([
    supabase.from("dealers").select("*"),
    supabase
      .from("tasks")
      .select("*, dealers(company_name)")
      .neq("status", "Completed")
      .neq("status", "Cancelled")
      .order("due_date", { ascending: true }),
    supabase
      .from("orders")
      .select("id, status, order_date, order_items(id, quantity, total)")
      .gte("order_date", startStr)
      .lte("order_date", endStr),
    supabase
      .from("invoices")
      .select("dealer_id, invoice_date, status, invoice_items(total)")
      .neq("status", "Cancelled")
      .gte("invoice_date", startStr)
      .lte("invoice_date", endStr),
  ]);

  const allItemIds = (orders ?? []).flatMap((o: any) => o.order_items.map((i: any) => i.id));
  const invoicedQtyByItem: Record<string, number> = {};
  if (allItemIds.length > 0) {
    const { data: invItems } = await supabase
      .from("invoice_items")
      .select("order_item_id, quantity, invoices!inner(status)")
      .in("order_item_id", allItemIds)
      .neq("invoices.status", "Cancelled");
    for (const row of invItems ?? []) {
      if (!row.order_item_id) continue;
      invoicedQtyByItem[row.order_item_id] = (invoicedQtyByItem[row.order_item_id] ?? 0) + (Number(row.quantity) || 0);
    }
  }

  const totalDealers = dealers?.length ?? 0;
  const totalPlan = dealers?.reduce((s, d) => s + (Number(d.annual_sales_plan) || 0), 0) ?? 0;
  const actualSales = (invoices ?? []).reduce(
    (s, inv) => s + (inv.invoice_items ?? []).reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0),
    0
  );
  const achievementPct = totalPlan > 0 ? Math.round((actualSales / totalPlan) * 100) : 0;

  // Build the 12 fiscal-year months (Apr → Mar) and bucket order/invoice values into them
  const monthKeys: string[] = [];
  const monthLabels: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(fyStart.getFullYear(), fyStart.getMonth() + i, 1);
    monthKeys.push(`${d.getFullYear()}-${d.getMonth()}`);
    monthLabels.push(d.toLocaleString("en", { month: "short" }));
  }
  const orderedByMonth: Record<string, number> = {};
  const invoicedByMonth: Record<string, number> = {};

  for (const o of orders ?? []) {
    const d = new Date(o.order_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    for (const item of o.order_items as any[]) {
      const s = computeItemStatus(item.quantity, invoicedQtyByItem[item.id] ?? 0, o.status);
      if (s.label !== "Cancelled") {
        orderedByMonth[key] = (orderedByMonth[key] ?? 0) + (Number(item.total) || 0);
      }
    }
  }
  for (const inv of invoices ?? []) {
    const d = new Date(inv.invoice_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const sum = (inv.invoice_items ?? []).reduce((s: number, it: any) => s + (Number(it.total) || 0), 0);
    invoicedByMonth[key] = (invoicedByMonth[key] ?? 0) + sum;
  }

  const chartData = monthKeys.map((key, i) => ({
    label: monthLabels[i],
    ordered: orderedByMonth[key] ?? 0,
    invoiced: invoicedByMonth[key] ?? 0,
  }));

  const dueSoonTasks = (tasks ?? []).filter((t) => t.due_date && (isToday(new Date(t.due_date)) || isPast(new Date(t.due_date))));

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <span className="text-xs text-slate-400">Fiscal year: {label} (Apr–Mar)</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Dealers" value={totalDealers} />
        <KpiCard label="Total Orders" value={orders?.length ?? 0} />
        <KpiCard label="Actual Sales (EUR)" value={actualSales.toLocaleString("de-DE")} accent="success" />
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Target Achievement (%)</div>
          <div className={`text-2xl font-semibold ${achievementColorClass(achievementPct)}`}>{achievementPct}%</div>
          <div className="text-xs text-slate-400 mt-1">
            {actualSales.toLocaleString("de-DE")} / {totalPlan.toLocaleString("de-DE")} EUR
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-medium mb-4">Dealer Conversion Funnel</h2>
          <ConversionFunnel dealers={dealers ?? []} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-medium mb-4">Ordered vs Invoiced by Month</h2>
          <MonthlySalesChart data={chartData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-medium mb-3">Tasks Due Today &amp; Overdue</h2>
          {dueSoonTasks.length === 0 && <p className="text-sm text-slate-400">Nothing due — all clear</p>}
          <ul className="space-y-2">
            {dueSoonTasks.map((t) => {
              const overdue = t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date));
              return (
                <li key={t.id} className="text-sm flex justify-between border-b border-slate-100 pb-2">
                  <Link href={`/tasks/${t.id}`} className={`hover:underline ${overdue ? "text-red-600 font-medium" : ""}`}>
                    {t.title}
                  </Link>
                  <span className={overdue ? "text-red-500" : "text-slate-400"}>
                    {t.due_date ? format(new Date(t.due_date), "dd.MM.yyyy") : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Dealers</h2>
            <Link href="/dealers" className="text-sm text-slate-600 underline">
              All dealers →
            </Link>
          </div>
          <ul className="space-y-2">
            {(dealers ?? []).slice(0, 5).map((d) => (
              <li key={d.id} className="text-sm flex justify-between border-b border-slate-100 pb-2">
                <Link href={`/dealers/${d.id}`} className="hover:underline">
                  {d.company_name}
                </Link>
                <span className="text-slate-400">{d.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
