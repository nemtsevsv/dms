import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import MarketingTypesPie from "@/components/MarketingTypesPie";
import MarketingFunnelWidget from "@/components/MarketingFunnelWidget";
import MarketingTrendChart from "@/components/MarketingTrendChart";
import MarketingCompactCalendar from "@/components/MarketingCompactCalendar";
import { toDateStr } from "@/lib/calendarMonth";
import { getFiscalYearRange } from "@/lib/fiscalYear";

export const dynamic = "force-dynamic";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function MarketingDashboardPage() {
  const supabase = createClient();
  const now = new Date();
  const nowKey = monthKey(now);

  const { start: fyStart } = getFiscalYearRange(now);
  const fyMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(fyStart.getFullYear(), fyStart.getMonth() + i, 1);
    return { key: monthKey(d), label: MONTH_NAMES[d.getMonth()], date: d };
  });
  const fyStartStr = toDateStr(fyMonths[0].date);
  const fyEndDate = new Date(fyMonths[11].date.getFullYear(), fyMonths[11].date.getMonth() + 1, 0);
  const fyEndStr = toDateStr(fyEndDate);

  // Wide window for the calendar widget — a year back, a year ahead.
  const calendarRangeStart = toDateStr(new Date(now.getFullYear() - 1, now.getMonth(), 1));
  const calendarRangeEnd = toDateStr(new Date(now.getFullYear() + 1, now.getMonth() + 1, 0));

  const [{ data: calendarActivities }, { data: invoiceRows }, { data: receiptRows }] = await Promise.all([
    supabase
      .from("marketing_activities")
      .select("id, name, activity_type, status, start_date, end_date, country, store_id, dealer_id, reach, clicks, leads, planned_participants, registered, participated, purchased")
      .lte("start_date", calendarRangeEnd)
      .gte("end_date", calendarRangeStart)
      .order("start_date"),
    supabase.from("invoices").select("invoice_date, status, invoice_items(total)").neq("status", "Cancelled").gte("invoice_date", fyStartStr).lte("invoice_date", fyEndStr),
    supabase.from("store_receipts").select("occurred_at, store_receipt_items(total)").gte("occurred_at", `${fyStartStr}T00:00:00Z`).lte("occurred_at", `${fyEndStr}T23:59:59Z`),
  ]);

  const activities = calendarActivities ?? [];

  // ---- Level 1: this-month widgets ----
  const thisMonthActivities = activities.filter((a) => a.start_date.slice(0, 7) <= nowKey && a.end_date.slice(0, 7) >= nowKey);
  const typeCounts = new Map<string, number>();
  for (const a of thisMonthActivities) {
    const t = a.activity_type || "Other";
    typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
  }
  const pieData = Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);

  const sum = (arr: any[], field: string) => arr.reduce((s, a) => s + (Number(a[field]) || 0), 0);
  const onlineFunnel = [
    { label: "Reach", value: sum(thisMonthActivities, "reach") },
    { label: "Clicks", value: sum(thisMonthActivities, "clicks") },
    { label: "Leads", value: sum(thisMonthActivities, "leads") },
  ];
  const offlineFunnel = [
    { label: "Planned", value: sum(thisMonthActivities, "planned_participants") },
    { label: "Registered", value: sum(thisMonthActivities, "registered") },
    { label: "Participated", value: sum(thisMonthActivities, "participated") },
    { label: "Purchased", value: sum(thisMonthActivities, "purchased") },
  ];

  // ---- Level 2: monthly trend charts ----
  const dealerSalesByMonth = new Map<string, number>();
  for (const inv of invoiceRows ?? []) {
    const k = (inv.invoice_date as string).slice(0, 7);
    const total = (inv.invoice_items ?? []).reduce((s: number, it: any) => s + (Number(it.total) || 0), 0);
    dealerSalesByMonth.set(k, (dealerSalesByMonth.get(k) ?? 0) + total);
  }
  const retailSalesByMonth = new Map<string, number>();
  for (const r of receiptRows ?? []) {
    const k = (r.occurred_at as string).slice(0, 7);
    const total = (r.store_receipt_items ?? []).reduce((s: number, it: any) => s + (Number(it.total) || 0), 0);
    retailSalesByMonth.set(k, (retailSalesByMonth.get(k) ?? 0) + total);
  }

  const dealerRelevant = activities.filter((a) => a.dealer_id || a.country);
  const retailRelevant = activities.filter((a) => a.store_id || a.country);

  function monthlyActivityStats(list: typeof activities, key: string) {
    const overlapping = list.filter((a) => a.start_date.slice(0, 7) <= key && a.end_date.slice(0, 7) >= key);
    return { count: overlapping.length, reach: sum(overlapping, "reach") + sum(overlapping, "planned_participants") };
  }

  const dealerChartData = fyMonths.map((m) => {
    const stats = monthlyActivityStats(dealerRelevant, m.key);
    return { label: m.label, sales: dealerSalesByMonth.get(m.key) ?? 0, eventCount: stats.count, reach: stats.reach };
  });
  const retailChartData = fyMonths.map((m) => {
    const stats = monthlyActivityStats(retailRelevant, m.key);
    return { label: m.label, sales: retailSalesByMonth.get(m.key) ?? 0, eventCount: stats.count, reach: stats.reach };
  });

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Marketing Dashboard</h1>

      {/* Level 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Activities This Month</div>
          <div className="text-3xl font-semibold text-slate-900">{thisMonthActivities.length}</div>
        </div>
        <MarketingTypesPie data={pieData} />
        <MarketingFunnelWidget title="Online Funnel" stages={onlineFunnel} />
        <MarketingFunnelWidget title="Offline / Events Funnel" stages={offlineFunnel} />
      </div>

      {/* Level 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="font-medium mb-4">Dealers — Sales vs. Marketing Activity</h2>
          <MarketingTrendChart data={dealerChartData} barColor="#2563EB" barLabel="Dealer Sales" />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="font-medium mb-4">Retail — Sales vs. Marketing Activity</h2>
          <MarketingTrendChart data={retailChartData} barColor="#10B981" barLabel="Retail Sales" />
        </div>
      </div>

      {/* Level 3 — compact calendar */}
      <MarketingCompactCalendar activities={activities as any} />
    </AppShell>
  );
}
