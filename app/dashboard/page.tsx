import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import KpiCard from "@/components/KpiCard";
import Link from "next/link";
import { format, isToday, isPast } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: dealers } = await supabase.from("dealers").select("*");
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, dealers(company_name)")
    .neq("status", "Completed")
    .neq("status", "Cancelled")
    .order("due_date", { ascending: true });
  const { data: waitingItems } = await supabase
    .from("order_items")
    .select("id, total, orders(order_number)")
    .eq("status", "Waiting");

  const totalDealers = dealers?.length ?? 0;
  const activeDealers = dealers?.filter((d) => d.status === "Active").length ?? 0;
  const totalPlan = dealers?.reduce((s, d) => s + (Number(d.annual_sales_plan) || 0), 0) ?? 0;
  const waitingCount = waitingItems?.length ?? 0;

  const todayTasks = tasks?.filter((t) => t.due_date && isToday(new Date(t.due_date))) ?? [];
  const overdueTasks =
    tasks?.filter((t) => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))) ?? [];

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <KpiCard label="Total Dealers" value={totalDealers} />
        <KpiCard label="Active Dealers" value={activeDealers} accent="success" />
        <KpiCard label="Annual Sales Plan (EUR)" value={totalPlan.toLocaleString("de-DE")} />
        <KpiCard
          label="Overdue Tasks"
          value={overdueTasks.length}
          accent={overdueTasks.length > 0 ? "danger" : "default"}
        />
        <KpiCard
          label="Позиций ждёт счёта"
          value={waitingCount}
          accent={waitingCount > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-medium mb-3">Задачи на сегодня</h2>
          {todayTasks.length === 0 && (
            <p className="text-sm text-slate-400">Нет задач на сегодня</p>
          )}
          <ul className="space-y-2">
            {todayTasks.map((t) => (
              <li key={t.id} className="text-sm flex justify-between border-b border-slate-100 pb-2">
                <span>{t.title}</span>
                <span className="text-slate-400">{(t as any).dealers?.company_name ?? ""}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-medium mb-3 text-red-600">Просроченные задачи</h2>
          {overdueTasks.length === 0 && (
            <p className="text-sm text-slate-400">Просроченных задач нет</p>
          )}
          <ul className="space-y-2">
            {overdueTasks.map((t) => (
              <li key={t.id} className="text-sm flex justify-between border-b border-slate-100 pb-2">
                <span>{t.title}</span>
                <span className="text-red-500">{format(new Date(t.due_date), "dd.MM.yyyy")}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {waitingCount > 0 && (
        <div className="mt-8 bg-white border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-amber-700">Ждёт выставления счёта / решения</h2>
            <Link href="/orders" className="text-sm text-slate-600 underline">
              Все заказы →
            </Link>
          </div>
          <ul className="space-y-2">
            {(waitingItems ?? []).slice(0, 8).map((i: any) => (
              <li key={i.id} className="text-sm flex justify-between border-b border-slate-100 pb-2">
                <span>{i.orders?.order_number}</span>
                <span className="text-slate-400">{Number(i.total ?? 0).toLocaleString("de-DE")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Дилеры</h2>
          <Link href="/dealers" className="text-sm text-slate-600 underline">
            Все дилеры →
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
    </AppShell>
  );
}
