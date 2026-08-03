import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import RetailDashboardClient from "./RetailDashboardClient";
import { toDateStr } from "@/lib/isoWeek";

export const dynamic = "force-dynamic";

export default async function RetailDashboardPage() {
  const supabase = createClient();
  const todayStr = toDateStr(new Date());
  const monthStart = `${todayStr.slice(0, 7)}-01`;

  const { data: stores } = await supabase.from("stores").select("id, name, currency, fx_rate_to_eur").eq("status", "Active");

  const metrics = await Promise.all(
    (stores ?? []).map(async (store) => {
      const [{ data: trafficToday }, { data: receiptsToday }, { data: plan }, { data: monthReceipts }, { data: reportToday }] = await Promise.all([
        supabase
          .from("store_traffic_events")
          .select("event_type")
          .eq("store_id", store.id)
          .gte("occurred_at", `${todayStr}T00:00:00Z`)
          .lte("occurred_at", `${todayStr}T23:59:59Z`),
        supabase
          .from("store_receipts")
          .select("id")
          .eq("store_id", store.id)
          .gte("occurred_at", `${todayStr}T00:00:00Z`)
          .lte("occurred_at", `${todayStr}T23:59:59Z`),
        supabase
          .from("store_sales_plan")
          .select("plan_amount_local")
          .eq("store_id", store.id)
          .eq("year", new Date().getFullYear())
          .eq("month", new Date().getMonth() + 1)
          .maybeSingle(),
        supabase
          .from("store_receipts")
          .select("occurred_at, created_by, store_receipt_items(total)")
          .eq("store_id", store.id)
          .gte("occurred_at", `${monthStart}T00:00:00Z`),
        supabase.from("daily_reports").select("id").eq("store_id", store.id).eq("report_date", todayStr).maybeSingle(),
      ]);

      const fxRate = store.fx_rate_to_eur || 1;
      const visitorsToday = (trafficToday ?? []).filter((t) => t.event_type === "visitor").length;
      const testDrivesToday = (trafficToday ?? []).filter((t) => t.event_type === "test_drive").length;
      const receiptsCount = (receiptsToday ?? []).length;
      const conversionPct = visitorsToday > 0 ? (receiptsCount / visitorsToday) * 100 : 0;

      const monthSalesLocal = (monthReceipts ?? []).reduce(
        (s, r: any) => s + (r.store_receipt_items ?? []).reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0),
        0
      );
      const monthPlanLocal = plan?.plan_amount_local ?? 0;
      const monthSalesEur = monthSalesLocal / fxRate;
      const monthPlanEur = monthPlanLocal / fxRate;
      const achievementPct = monthPlanLocal > 0 ? (monthSalesLocal / monthPlanLocal) * 100 : 0;

      // Top sellers this month, by who is on each receipt (store_receipts.created_by)
      const sellerTotals = new Map<string, number>();
      for (const r of monthReceipts ?? []) {
        const seller = (r as any).created_by ?? "Unknown";
        const sum = ((r as any).store_receipt_items ?? []).reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0);
        sellerTotals.set(seller, (sellerTotals.get(seller) ?? 0) + sum);
      }
      const topSellers = Array.from(sellerTotals.entries())
        .map(([email, totalLocal]) => ({ email, totalEur: totalLocal / fxRate }))
        .sort((a, b) => b.totalEur - a.totalEur)
        .slice(0, 5);

      return {
        id: store.id,
        name: store.name,
        currency: store.currency,
        trafficToday: visitorsToday,
        testDrivesToday,
        receiptsToday: receiptsCount,
        conversionPct,
        monthSalesEur,
        monthPlanEur,
        achievementPct,
        hasReportToday: !!reportToday,
        topSellers,
      };
    })
  );

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Retail Dashboard</h1>
      <RetailDashboardClient stores={metrics} />
    </AppShell>
  );
}
