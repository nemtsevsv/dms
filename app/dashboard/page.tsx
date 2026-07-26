import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import KpiCard from "@/components/KpiCard";
import ConversionFunnel from "@/components/ConversionFunnel";
import Link from "next/link";
import { format, isToday, isPast } from "date-fns";
import { getCurrentFiscalYearBounds } from "@/lib/fiscalYear";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const { startStr, endStr, label } = getCurrentFiscalYearBounds();

  const { data: dealers } = await supabase.from("dealers").select("*");
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, dealers(company_name)")
    .neq("status", "Completed")
    .neq("status", "Cancelled")
    .order("due_date", { ascending: true });
  const { data: orders } = await supabase.from("orders").select("id");
  const { data: invoices } = await supabase
    .from("invoices")
    .select("dealer_id, invoice_date, status, invoice_items(total)")
    .neq("status", "Cancelled")
    .gte("invoice_date", startStr)
    .lte("invoice_date", endStr);

  const totalDealers = dealers?.length ?? 0;
  const totalPlan = dealers?.reduce((s, d) => s + (Number(d.annual_sales_plan) || 0), 0) ?? 0;
  const actualSales = (invoices ?? []).reduce(
    (s, inv) => s + (inv.invoice_items ?? []).reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0),
    0
  );
  const achievementPct = totalPlan > 0 ? Math.round((actualSales / totalPlan) * 100) : 0;

  const todayTasks = tasks?.filter((t) => t.due_date && isToday(new Date(t.due_date))) ?? [];
  const overdueTasks =
    tasks?.filter((t) => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))) ?? [];

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
        <KpiCard
          label="Target Achievement (%)"
          value={`${achievementPct}%`}
          hint={`${actualSales.toLocaleString("de-DE")} / ${totalPlan.toLocaleString("de-DE")} EUR`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-medium mb-4">Dealer Conversion Funnel</h2>
          <ConversionFunnel dealers={dealers ?? []} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-medium mb-3">Today's Tasks</h2>
          {todayTasks.length === 0 && <p className="text-sm text-slate-400">No tasks due today</p>}
          <ul className="space-y-2">
            {todayTasks.map((t) => (
              <li key={t.id} className="text-sm flex justify-between border-b border-slate-100 pb-2">
                <Link href={`/tasks/${t.id}`} className="hover:underline">
                  {t.title}
                </Link>
                <span className="text-slate-400">{(t as any).dealers?.company_name ?? ""}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-medium mb-3 text-red-600">Overdue Tasks</h2>
          {overdueTasks.length === 0 && <p className="text-sm text-slate-400">No overdue tasks</p>}
          <ul className="space-y-2">
            {overdueTasks.map((t) => (
              <li key={t.id} className="text-sm flex justify-between border-b border-slate-100 pb-2">
                <Link href={`/tasks/${t.id}`} className="hover:underline">
                  {t.title}
                </Link>
                <span className="text-red-500">{format(new Date(t.due_date), "dd.MM.yyyy")}</span>
              </li>
            ))}
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
