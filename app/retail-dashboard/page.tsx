import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import RetailDashboardClient from "./RetailDashboardClient";
import { toDateStr, getWeekStart, getWeekEnd } from "@/lib/isoWeek";
import { getFiscalYearRange } from "@/lib/fiscalYear";

export const dynamic = "force-dynamic";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function RetailDashboardPage() {
  const supabase = createClient();
  const now = new Date();
  const todayStr = toDateStr(now);
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);
  const weekStartStr = toDateStr(weekStart);
  const weekEndStr = toDateStr(weekEnd);
  const monthStart = `${todayStr.slice(0, 7)}-01`;
  const { start: fyStart } = getFiscalYearRange(now);

  const { data: stores } = await supabase.from("stores").select("id, name, currency, fx_rate_to_eur").eq("status", "Active");

  const metrics = await Promise.all(
    (stores ?? []).map(async (store) => {
      const fxRate = store.fx_rate_to_eur || 1;

      const [
        { data: trafficThisWeek },
        { data: receiptsThisWeek },
        { data: trafficThisMonth },
        { data: receiptsThisMonth },
        { data: plans },
        { data: yearReceipts },
        { data: yearTraffic },
        { data: reportToday },
      ] = await Promise.all([
        supabase.from("store_traffic_events").select("event_type, occurred_at").eq("store_id", store.id).gte("occurred_at", `${weekStartStr}T00:00:00Z`).lte("occurred_at", `${weekEndStr}T23:59:59Z`),
        supabase.from("store_receipts").select("id, occurred_at, store_receipt_items(total)").eq("store_id", store.id).gte("occurred_at", `${weekStartStr}T00:00:00Z`).lte("occurred_at", `${weekEndStr}T23:59:59Z`),
        supabase.from("store_traffic_events").select("event_type").eq("store_id", store.id).gte("occurred_at", `${monthStart}T00:00:00Z`),
        supabase.from("store_receipts").select("id, store_receipt_items(total)").eq("store_id", store.id).gte("occurred_at", `${monthStart}T00:00:00Z`),
        supabase.from("store_sales_plan").select("year, month, plan_amount_local").eq("store_id", store.id),
        supabase.from("store_receipts").select("occurred_at, store_receipt_items(total)").eq("store_id", store.id).gte("occurred_at", toDateStr(fyStart) + "T00:00:00Z"),
        supabase.from("store_traffic_events").select("event_type, occurred_at").eq("store_id", store.id).eq("event_type", "visitor").gte("occurred_at", toDateStr(fyStart) + "T00:00:00Z"),
        supabase.from("daily_reports").select("id").eq("store_id", store.id).eq("report_date", todayStr).maybeSingle(),
      ]);

      // Weekly KPIs
      const visitorsThisWeek = (trafficThisWeek ?? []).filter((t) => t.event_type === "visitor").length;
      const testDrivesThisWeek = (trafficThisWeek ?? []).filter((t) => t.event_type === "test_drive").length;
      const receiptsCountThisWeek = (receiptsThisWeek ?? []).length;
      const conversionPct = visitorsThisWeek > 0 ? (receiptsCountThisWeek / visitorsThisWeek) * 100 : 0;

      // Monthly funnel
      const visitorsThisMonth = (trafficThisMonth ?? []).filter((t) => t.event_type === "visitor").length;
      const testDrivesThisMonth = (trafficThisMonth ?? []).filter((t) => t.event_type === "test_drive").length;
      const receiptsThisMonthCount = (receiptsThisMonth ?? []).length;

      // Current month sales / achievement
      const planMap = new Map((plans ?? []).map((p) => [`${p.year}-${p.month}`, p.plan_amount_local]));
      const thisMonthPlanLocal = planMap.get(`${now.getFullYear()}-${now.getMonth() + 1}`) ?? 0;
      const monthSalesLocal = (receiptsThisMonth ?? []).reduce(
        (s, r: any) => s + (r.store_receipt_items ?? []).reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0),
        0
      );
      const monthSalesEur = monthSalesLocal / fxRate;
      const achievementPct = thisMonthPlanLocal > 0 ? (monthSalesLocal / thisMonthPlanLocal) * 100 : 0;

      // Monthly chart: 12 FY months, target vs actual (EUR) + traffic
      const salesByMonth = new Map<string, number>();
      for (const r of yearReceipts ?? []) {
        const key = (r as any).occurred_at.slice(0, 7);
        const sum = ((r as any).store_receipt_items ?? []).reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0);
        salesByMonth.set(key, (salesByMonth.get(key) ?? 0) + sum);
      }
      const trafficByMonth = new Map<string, number>();
      for (const t of yearTraffic ?? []) {
        const key = (t as any).occurred_at.slice(0, 7);
        trafficByMonth.set(key, (trafficByMonth.get(key) ?? 0) + 1);
      }
      const monthlyChart = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(fyStart.getFullYear(), fyStart.getMonth() + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const targetLocal = planMap.get(`${d.getFullYear()}-${d.getMonth() + 1}`) ?? 0;
        const actualLocal = salesByMonth.get(key) ?? 0;
        return {
          label: MONTH_NAMES[d.getMonth()],
          target: targetLocal / fxRate,
          actual: actualLocal / fxRate,
          traffic: trafficByMonth.get(key) ?? 0,
        };
      });

      // Weekly chart: Mon-Sun of current week, actual sales (EUR) + traffic
      const salesByDay = new Map<string, number>();
      for (const r of receiptsThisWeek ?? []) {
        const key = (r as any).occurred_at.slice(0, 10);
        const sum = ((r as any).store_receipt_items ?? []).reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0);
        salesByDay.set(key, (salesByDay.get(key) ?? 0) + sum);
      }
      const trafficByDay = new Map<string, number>();
      for (const t of trafficThisWeek ?? []) {
        if (t.event_type !== "visitor") continue;
        const key = (t as any).occurred_at.slice(0, 10);
        trafficByDay.set(key, (trafficByDay.get(key) ?? 0) + 1);
      }
      const weeklyChart = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const key = toDateStr(d);
        return {
          label: DAY_NAMES[i],
          actual: (salesByDay.get(key) ?? 0) / fxRate,
          traffic: trafficByDay.get(key) ?? 0,
        };
      });

      return {
        id: store.id,
        name: store.name,
        currency: store.currency,
        trafficThisWeek: visitorsThisWeek,
        testDrivesThisWeek,
        receiptsThisWeek: receiptsCountThisWeek,
        conversionPct,
        monthSalesEur,
        achievementPct,
        hasReportToday: !!reportToday,
        funnel: { visitors: visitorsThisMonth, testDrives: testDrivesThisMonth, receipts: receiptsThisMonthCount },
        monthlyChart,
        weeklyChart,
        topSellers: [] as { email: string; totalEur: number }[],
      };
    })
  );

  // Top sellers this month, computed separately to keep the block above readable
  const metricsWithSellers = await Promise.all(
    metrics.map(async (m) => {
      const { data: monthReceipts } = await supabase
        .from("store_receipts")
        .select("created_by, store_receipt_items(total)")
        .eq("store_id", m.id)
        .gte("occurred_at", `${monthStart}T00:00:00Z`);
      const store = (stores ?? []).find((s) => s.id === m.id);
      const fxRate = store?.fx_rate_to_eur || 1;
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
      return { ...m, topSellers };
    })
  );

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Retail Dashboard</h1>
      <RetailDashboardClient stores={metricsWithSellers} />
    </AppShell>
  );
}
