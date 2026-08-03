"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hoursForDate, openDaysInMonth, type ScheduleRow, getHourSlotsForDate } from "@/lib/storeSchedule";
import { toDateStr } from "@/lib/isoWeek";
import MorningBrief from "./store/MorningBrief";
import VisitorTrafficSlots from "./store/VisitorTrafficSlots";
import CustomerActivities from "./store/CustomerActivities";
import SalesEntry from "./store/SalesEntry";
import EndOfDay from "./store/EndOfDay";

type Product = { sku: string; product_name: string; local_price: number };
type PlanRow = { year: number; month: number; plan_amount_local: number };

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function AdminDailyReportEditor({
  storeId,
  currency,
  fxRate,
  schedule,
  plans,
  products,
  staffOptions,
}: {
  storeId: string;
  currency: string;
  fxRate: number;
  schedule: ScheduleRow[];
  plans: PlanRow[];
  products: Product[];
  staffOptions: { email: string; displayName: string }[];
}) {
  const supabase = createClient();
  const [dateStr, setDateStr] = useState(toDateStr(new Date()));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const reload = () => setReloadTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const date = new Date(dateStr);
      const monthStart = `${dateStr.slice(0, 7)}-01`;

      const [{ data: report }, { data: traffic }, { data: receipts }, { data: monthReceipts }] = await Promise.all([
        supabase.from("daily_reports").select("*").eq("store_id", storeId).eq("report_date", dateStr).maybeSingle(),
        supabase.from("store_traffic_events").select("event_type, customer_type, occurred_at").eq("store_id", storeId).gte("occurred_at", `${dateStr}T00:00:00Z`).lte("occurred_at", `${dateStr}T23:59:59Z`),
        supabase.from("store_receipts").select("id, occurred_at, created_by, store_receipt_items(id, sku, product_name, quantity, unit_price, total, item_type)").eq("store_id", storeId).gte("occurred_at", `${dateStr}T00:00:00Z`).lte("occurred_at", `${dateStr}T23:59:59Z`),
        supabase.from("store_receipts").select("occurred_at, store_receipt_items(total)").eq("store_id", storeId).gte("occurred_at", `${monthStart}T00:00:00Z`).lte("occurred_at", `${dateStr}T23:59:59Z`),
      ]);

      if (!cancelled) {
        setData({ date, report, traffic: traffic ?? [], receipts: receipts ?? [], monthReceipts: monthReceipts ?? [] });
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dateStr, storeId, reloadTick]);

  if (loading || !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <input
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4"
        />
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  const { date, report, traffic, receipts, monthReceipts } = data;

  const planMap = new Map(plans.map((p) => [`${p.year}-${p.month}`, p.plan_amount_local]));
  const thisMonthPlan = planMap.get(`${date.getFullYear()}-${date.getMonth() + 1}`) ?? 0;
  const openDays = openDaysInMonth(schedule, date.getFullYear(), date.getMonth() + 1);
  const dailyTarget = openDays > 0 ? thisMonthPlan / openDays : 0;
  const workingHours = hoursForDate(schedule, date);
  const slots = getHourSlotsForDate(schedule, date);

  const slotCounts: Record<string, number> = {};
  const activityCounts: Record<string, number> = {};
  let visitorsToday = 0;
  let newVisitors = 0;
  for (const t of traffic) {
    if (t.event_type === "visitor") {
      visitorsToday++;
      if (t.customer_type === "new") newVisitors++;
      const hour = new Date(t.occurred_at).getUTCHours();
      slotCounts[`${hour}-${t.customer_type}`] = (slotCounts[`${hour}-${t.customer_type}`] ?? 0) + 1;
    } else {
      const key = `${t.event_type}-${t.customer_type}`;
      activityCounts[key] = (activityCounts[key] ?? 0) + 1;
    }
  }
  const callsThisWeek = 0; // weekly KPI context doesn't apply cleanly to an arbitrary past day; shown as 0 here
  const testDrivesThisWeek = 0;

  const todaySalesTotal = receipts.reduce((s: number, r: any) => s + (r.store_receipt_items ?? []).reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0), 0);
  const todayCoreTotal = receipts.reduce(
    (s: number, r: any) => s + (r.store_receipt_items ?? []).filter((it: any) => it.item_type === "core").reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0),
    0
  );
  const todayAccessoriesTotal = receipts.reduce(
    (s: number, r: any) => s + (r.store_receipt_items ?? []).filter((it: any) => it.item_type === "accessory").reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0),
    0
  );
  const dailyAchievementPct = dailyTarget > 0 ? (todaySalesTotal / dailyTarget) * 100 : 0;
  const monthSalesTotal = monthReceipts.reduce((s: number, r: any) => s + (r.store_receipt_items ?? []).reduce((s2: number, it: any) => s2 + (Number(it.total) || 0), 0), 0);
  const monthAchievementPct = thisMonthPlan > 0 ? (monthSalesTotal / thisMonthPlan) * 100 : 0;

  const soldReceiptsToday = receipts.map((r: any) => ({
    receiptId: r.id,
    createdBy: r.created_by,
    items: (r.store_receipt_items ?? []).map((it: any) => ({
      itemId: it.id,
      sku: it.sku,
      productName: it.product_name,
      quantity: it.quantity,
      unitPrice: it.unit_price,
      total: it.total,
      itemType: it.item_type,
    })),
  }));

  // If the admin manually corrected today's Core/Accessories, downstream
  // Performance metrics should reflect that corrected figure.
  const effectiveReceiptsCount = report?.manual_receipts ?? receipts.length;
  const effectiveCore = report?.manual_sales_core ?? todayCoreTotal;
  const effectiveAccessories = report?.manual_sales_accessories ?? todayAccessoriesTotal;
  const effectiveSalesTotal = effectiveCore + effectiveAccessories;
  const effectiveAchievementPct = dailyTarget > 0 ? (effectiveSalesTotal / dailyTarget) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
        <label className="text-sm text-slate-500">Editing report for:</label>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
        <span className="text-xs text-slate-400">Admins can add or correct any day's report here.</span>
      </div>

      <MorningBrief
        storeId={storeId}
        reportDate={dateStr}
        employeeName={report?.submitted_by ?? "Admin"}
        existing={report}
        dailyTarget={round2(dailyTarget)}
        dailyTargetEur={round2(fxRate > 0 ? dailyTarget / fxRate : 0)}
        currency={currency}
        workingHours={workingHours}
        focus={null}
        onChange={reload}
      />
      <VisitorTrafficSlots storeId={storeId} reportDate={dateStr} slots={slots} slotCounts={slotCounts} onChange={reload} />
      <CustomerActivities storeId={storeId} reportDate={dateStr} counts={activityCounts} onChange={reload} />
      <SalesEntry
        storeId={storeId}
        reportDate={dateStr}
        products={products}
        currency={currency}
        todayReceiptsCount={receipts.length}
        todaySalesTotal={todaySalesTotal}
        todayCoreTotal={todayCoreTotal}
        todayAccessoriesTotal={todayAccessoriesTotal}
        dailyTarget={round2(dailyTarget)}
        soldReceiptsToday={soldReceiptsToday}
        staffOptions={staffOptions}
        manualReceipts={report?.manual_receipts ?? null}
        manualSalesCore={report?.manual_sales_core ?? null}
        manualSalesAccessories={report?.manual_sales_accessories ?? null}
        isAdmin={true}
        onChange={reload}
      />
      <EndOfDay
        storeId={storeId}
        reportDate={dateStr}
        existingSelfEval={report?.self_evaluation ?? null}
        dailyAchievementPct={effectiveAchievementPct}
        monthAchievementPct={monthAchievementPct}
        visitors={visitorsToday}
        newVisitors={newVisitors}
        receipts={effectiveReceiptsCount}
        salesTotal={effectiveSalesTotal}
        callsThisWeekPct={(callsThisWeek / 35) * 100}
        testDrivesThisWeekPct={(testDrivesThisWeek / 10) * 100}
        closedAt={report?.closed_at ?? null}
        closedBy={report?.closed_by ?? null}
        onChange={reload}
      />
    </div>
  );
}
