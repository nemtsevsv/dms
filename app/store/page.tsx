import { createClient } from "@/lib/supabase/server";
import { getStoreAccess } from "@/lib/storeAccess";
import { redirect } from "next/navigation";
import DealerTabs from "@/components/DealerTabs";
import MorningBrief from "@/components/store/MorningBrief";
import VisitorTrafficSlots from "@/components/store/VisitorTrafficSlots";
import CustomerActivities from "@/components/store/CustomerActivities";
import SalesEntry from "@/components/store/SalesEntry";
import EndOfDay from "@/components/store/EndOfDay";
import StoreWeeklyFocusEditor from "@/components/StoreWeeklyFocusEditor";
import StoreInventoryTable from "@/components/StoreInventoryTable";
import StoreDailyReportsHistory from "@/components/StoreDailyReportsHistory";
import { hoursForDate, openDaysInMonth, getHourSlotsForDate } from "@/lib/storeSchedule";
import { getWeekStart, getWeekEnd, toDateStr } from "@/lib/isoWeek";

export const dynamic = "force-dynamic";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default async function StoreHomePage() {
  const access = await getStoreAccess();
  if (!access.isStoreStaff || !access.storeId) redirect("/dashboard");

  const supabase = createClient();
  const storeId = access.storeId;
  const today = new Date();
  const todayStr = toDateStr(today);
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(today);

  const [
    { data: store },
    { data: schedule },
    { data: plan },
    { data: reportToday },
    { data: trafficToday },
    { data: trafficThisWeek },
    { data: receiptsToday },
    { data: focus },
    { data: products },
    { data: overrides },
    { data: stock },
    { data: reportsHistory },
    { data: myStaffRow },
  ] = await Promise.all([
    supabase.from("stores").select("*").eq("id", storeId).single(),
    supabase.from("store_schedule").select("*").eq("store_id", storeId),
    supabase.from("store_sales_plan").select("year, month, plan_amount_local").eq("store_id", storeId),
    supabase.from("daily_reports").select("*").eq("store_id", storeId).eq("report_date", todayStr).maybeSingle(),
    supabase.from("store_traffic_events").select("event_type, customer_type, occurred_at").eq("store_id", storeId).gte("occurred_at", `${todayStr}T00:00:00`).lte("occurred_at", `${todayStr}T23:59:59`),
    supabase.from("store_traffic_events").select("event_type").eq("store_id", storeId).gte("occurred_at", toDateStr(weekStart) + "T00:00:00").lte("occurred_at", toDateStr(weekEnd) + "T23:59:59"),
    supabase.from("store_receipts").select("id, occurred_at, store_receipt_items(total, item_type)").eq("store_id", storeId).gte("occurred_at", `${todayStr}T00:00:00`).lte("occurred_at", `${todayStr}T23:59:59`),
    supabase.from("store_weekly_focus").select("*").eq("store_id", storeId).eq("week_start_date", toDateStr(weekStart)).maybeSingle(),
    supabase.from("products").select("sku, product_name, retail_price_incl_vat"),
    supabase.from("store_price_overrides").select("sku, local_price").eq("store_id", storeId),
    supabase.from("store_inventory_current").select("*").eq("store_id", storeId),
    supabase.from("daily_reports").select("*").eq("store_id", storeId).order("report_date", { ascending: false }).limit(31),
    supabase.from("store_users").select("display_name, email").eq("store_id", storeId).eq("email", access.email).maybeSingle(),
  ]);

  const fxRate = store?.fx_rate_to_eur ?? 1;
  const overrideMap = new Map((overrides ?? []).map((o) => [o.sku, o.local_price]));
  const priceList = (products ?? []).map((p) => ({
    sku: p.sku,
    product_name: p.product_name,
    local_price: overrideMap.get(p.sku) ?? round2((p.retail_price_incl_vat ?? 0) * fxRate),
  }));

  // Today's target = this month's plan / number of scheduled open days this month
  const planMap = new Map((plan ?? []).map((p) => [`${p.year}-${p.month}`, p.plan_amount_local]));
  const thisMonthPlan = planMap.get(`${today.getFullYear()}-${today.getMonth() + 1}`) ?? 0;
  const openDays = openDaysInMonth(schedule ?? [], today.getFullYear(), today.getMonth() + 1);
  const dailyTarget = openDays > 0 ? thisMonthPlan / openDays : 0;
  const workingHours = hoursForDate(schedule ?? [], today);
  const slots = getHourSlotsForDate(schedule ?? [], today);

  // Today's traffic: visitor slot counts + calls/test-drive activity counts
  const slotCounts: Record<string, number> = {};
  const activityCounts: Record<string, number> = {};
  let visitorsToday = 0;
  let newVisitorsToday = 0;
  for (const t of trafficToday ?? []) {
    if (t.event_type === "visitor") {
      visitorsToday++;
      if (t.customer_type === "new") newVisitorsToday++;
      const hour = new Date(t.occurred_at).getUTCHours();
      slotCounts[`${hour}-${t.customer_type}`] = (slotCounts[`${hour}-${t.customer_type}`] ?? 0) + 1;
    } else {
      const key = `${t.event_type}-${t.customer_type}`;
      activityCounts[key] = (activityCounts[key] ?? 0) + 1;
    }
  }

  // This week's calls / test-drives vs KPI targets
  const callsThisWeek = (trafficThisWeek ?? []).filter((t) => t.event_type === "call").length;
  const testDrivesThisWeek = (trafficThisWeek ?? []).filter((t) => t.event_type === "test_drive").length;

  // Today's sales
  const todaySalesTotal = (receiptsToday ?? []).reduce(
    (s, r: any) => s + (r.store_receipt_items ?? []).reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0),
    0
  );
  const todayCoreTotal = (receiptsToday ?? []).reduce(
    (s, r: any) => s + (r.store_receipt_items ?? []).filter((it: any) => it.item_type === "core").reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0),
    0
  );
  const todayAccessoriesTotal = (receiptsToday ?? []).reduce(
    (s, r: any) => s + (r.store_receipt_items ?? []).filter((it: any) => it.item_type === "accessory").reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0),
    0
  );
  const dailyAchievementPct = dailyTarget > 0 ? (todaySalesTotal / dailyTarget) * 100 : 0;

  // Month-to-date achievement
  const monthReports = (reportsHistory ?? []).filter((r) => r.report_date.slice(0, 7) === todayStr.slice(0, 7));
  const monthDates = monthReports.map((r) => r.report_date);
  let monthSalesTotal = 0;
  if (monthDates.length > 0) {
    const { data: monthReceipts } = await supabase
      .from("store_receipts")
      .select("occurred_at, store_receipt_items(total)")
      .eq("store_id", storeId)
      .gte("occurred_at", `${todayStr.slice(0, 7)}-01T00:00:00`);
    monthSalesTotal = (monthReceipts ?? []).reduce(
      (s, r: any) => s + (r.store_receipt_items ?? []).reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0),
      0
    );
  }
  const monthAchievementPct = thisMonthPlan > 0 ? (monthSalesTotal / thisMonthPlan) * 100 : 0;

  // History rows for the "This Month" tab (reusing the same table shape as the admin card)
  const { data: allTraffic } = await supabase.from("store_traffic_events").select("event_type, occurred_at").eq("store_id", storeId);
  const { data: allReceipts } = await supabase.from("store_receipts").select("occurred_at, store_receipt_items(total)").eq("store_id", storeId);
  const visitorsByDate = new Map<string, number>();
  for (const t of allTraffic ?? []) {
    if (t.event_type !== "visitor") continue;
    const d = t.occurred_at.slice(0, 10);
    visitorsByDate.set(d, (visitorsByDate.get(d) ?? 0) + 1);
  }
  const salesByDate = new Map<string, number>();
  for (const r of allReceipts ?? []) {
    const d = r.occurred_at.slice(0, 10);
    const sum = (r.store_receipt_items ?? []).reduce((s: number, it: any) => s + (Number(it.total) || 0), 0);
    salesByDate.set(d, (salesByDate.get(d) ?? 0) + sum);
  }
  const historyRows = (reportsHistory ?? []).map((r) => {
    const sales = salesByDate.get(r.report_date) ?? 0;
    return {
      date: r.report_date,
      staffCount: r.staff_count,
      visitors: visitorsByDate.get(r.report_date) ?? 0,
      salesTotal: sales,
      achievementPct: dailyTarget > 0 ? Math.round((sales / dailyTarget) * 100) : 0,
      selfEvaluation: r.self_evaluation,
    };
  });

  const employeeName = myStaffRow?.display_name || access.email;

  return (
    <div className="space-y-4">
      {access.storeRole === "store_manager" && (
        <StoreWeeklyFocusEditor storeId={storeId} weekStart={weekStart} weekEnd={weekEnd} focus={focus} editable />
      )}

      <DealerTabs
        tabs={[
          {
            key: "today",
            label: "Today",
            content: (
              <div className="space-y-4">
                <MorningBrief
                  storeId={storeId}
                  reportDate={todayStr}
                  employeeName={employeeName}
                  existing={reportToday}
                  dailyTarget={round2(dailyTarget)}
                  dailyTargetEur={round2(fxRate > 0 ? dailyTarget / fxRate : 0)}
                  currency={store?.currency ?? "EUR"}
                  workingHours={workingHours}
                  focus={focus}
                />
                <VisitorTrafficSlots storeId={storeId} reportDate={todayStr} slots={slots} slotCounts={slotCounts} />
                <CustomerActivities storeId={storeId} reportDate={todayStr} counts={activityCounts} />
                <SalesEntry
                  storeId={storeId}
                  reportDate={todayStr}
                  products={priceList}
                  currency={store?.currency ?? "EUR"}
                  todayReceiptsCount={(receiptsToday ?? []).length}
                  todaySalesTotal={todaySalesTotal}
                  todayCoreTotal={todayCoreTotal}
                  todayAccessoriesTotal={todayAccessoriesTotal}
                  dailyTarget={round2(dailyTarget)}
                />
                <EndOfDay
                  storeId={storeId}
                  reportDate={todayStr}
                  existingSelfEval={reportToday?.self_evaluation ?? null}
                  dailyAchievementPct={dailyAchievementPct}
                  monthAchievementPct={monthAchievementPct}
                  visitors={visitorsToday}
                  newVisitors={newVisitorsToday}
                  receipts={(receiptsToday ?? []).length}
                  salesTotal={todaySalesTotal}
                  callsThisWeekPct={(callsThisWeek / 35) * 100}
                  testDrivesThisWeekPct={(testDrivesThisWeek / 10) * 100}
                />
              </div>
            ),
          },
          {
            key: "inventory",
            label: "Inventory",
            content: <StoreInventoryTable stock={stock ?? []} />,
          },
          {
            key: "month",
            label: "This Month",
            content: (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="text-xs text-slate-500 mb-1">Month-to-date</div>
                  <div className="text-2xl font-semibold">
                    {monthSalesTotal.toLocaleString("de-DE")} / {thisMonthPlan.toLocaleString("de-DE")} {store?.currency}
                  </div>
                </div>
                <StoreDailyReportsHistory rows={historyRows} currency={store?.currency ?? "EUR"} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
