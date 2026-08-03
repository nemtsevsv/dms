import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import DealerTabs from "@/components/DealerTabs";
import StoreForm from "@/components/StoreForm";
import StoreScheduleEditor from "@/components/StoreScheduleEditor";
import StoreStaffManager from "@/components/StoreStaffManager";
import StorePriceOverrides from "@/components/StorePriceOverrides";
import StoreSalesPlanEditor from "@/components/StoreSalesPlanEditor";
import StoreInventoryTable from "@/components/StoreInventoryTable";
import StoreDeliveryManager from "@/components/StoreDeliveryManager";
import StoreDailyReportsHistory from "@/components/StoreDailyReportsHistory";
import StoreWeeklyFocusEditor from "@/components/StoreWeeklyFocusEditor";
import AdminDailyReportEditor from "@/components/AdminDailyReportEditor";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWeekStart, getWeekEnd, toDateStr } from "@/lib/isoWeek";

export const dynamic = "force-dynamic";

export default async function StoreCardPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: store, error: storeError } = await supabase.from("stores").select("*").eq("id", params.id).single();
  if (storeError || !store) {
    console.error("[stores/[id]] failed to load store", { id: params.id, error: storeError });
    notFound();
  }

  const [{ data: schedule }, { data: staff }, { data: products }, { data: overrides }, { data: plans }, { data: stock }, { data: deliveries }] =
    await Promise.all([
      supabase.from("store_schedule").select("*").eq("store_id", params.id),
      supabase.from("store_users").select("*").eq("store_id", params.id).order("display_name"),
      supabase.from("products").select("sku, product_name, retail_price_incl_vat").order("product_name"),
      supabase.from("store_price_overrides").select("sku, local_price").eq("store_id", params.id),
      supabase.from("store_sales_plan").select("year, month, plan_amount_local").eq("store_id", params.id),
      supabase.from("store_inventory_current").select("*").eq("store_id", params.id),
      supabase.from("store_deliveries").select("id, delivery_date, note, created_by, store_delivery_items(id)").eq("store_id", params.id).order("delivery_date", { ascending: false }),
    ]);

  const deliveriesWithCount = (deliveries ?? []).map((d: any) => ({ ...d, item_count: d.store_delivery_items?.length ?? 0 }));

  function round2(n: number) {
    return Math.round(n * 100) / 100;
  }

  const fxRate = store.fx_rate_to_eur ?? 1;
  const overrideMap = new Map((overrides ?? []).map((o) => [o.sku, o.local_price]));
  const priceList = (products ?? []).map((p) => ({
    sku: p.sku,
    product_name: p.product_name,
    local_price: overrideMap.get(p.sku) ?? round2((p.retail_price_incl_vat ?? 0) * fxRate),
  }));

  const priceMap = new Map(priceList.map((p) => [p.sku, p.local_price]));
  const stockWithValue = (stock ?? []).map((s: any) => {
    const rsp = priceMap.get(s.sku) ?? 0;
    return { ...s, rsp, value: round2(s.quantity * rsp) };
  });

  // Daily report history with visitor/sales aggregates
  const { data: reports } = await supabase.from("daily_reports").select("*").eq("store_id", params.id).order("report_date", { ascending: false }).limit(60);
  const { data: traffic } = await supabase.from("store_traffic_events").select("event_type, occurred_at").eq("store_id", params.id);
  const { data: receipts } = await supabase.from("store_receipts").select("id, occurred_at, store_receipt_items(total)").eq("store_id", params.id);

  const visitorsByDate = new Map<string, number>();
  for (const t of traffic ?? []) {
    if (t.event_type !== "visitor") continue;
    const d = t.occurred_at.slice(0, 10);
    visitorsByDate.set(d, (visitorsByDate.get(d) ?? 0) + 1);
  }
  const salesByDate = new Map<string, number>();
  for (const r of receipts ?? []) {
    const d = r.occurred_at.slice(0, 10);
    const sum = (r.store_receipt_items ?? []).reduce((s: number, it: any) => s + (Number(it.total) || 0), 0);
    salesByDate.set(d, (salesByDate.get(d) ?? 0) + sum);
  }
  const planMap = new Map((plans ?? []).map((p) => [`${p.year}-${p.month}`, p.plan_amount_local]));

  const reportRows = (reports ?? []).map((r: any) => {
    const date = new Date(r.report_date);
    const monthlyPlan = planMap.get(`${date.getFullYear()}-${date.getMonth() + 1}`) ?? 0;
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const dailyTarget = monthlyPlan > 0 ? monthlyPlan / daysInMonth : 0;
    const salesTotal = salesByDate.get(r.report_date) ?? 0;
    return {
      date: r.report_date,
      staffCount: r.staff_count,
      visitors: visitorsByDate.get(r.report_date) ?? 0,
      salesTotal,
      achievementPct: dailyTarget > 0 ? Math.round((salesTotal / dailyTarget) * 100) : 0,
      selfEvaluation: r.self_evaluation,
    };
  });

  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const { data: focus } = await supabase
    .from("store_weekly_focus")
    .select("*")
    .eq("store_id", params.id)
    .eq("week_start_date", toDateStr(weekStart))
    .maybeSingle();

  return (
    <AppShell>
      <Link href="/stores" className="text-sm text-slate-500 hover:underline">
        ← All stores
      </Link>
      <h1 className="text-xl font-semibold mt-2 mb-6">{store.name}</h1>

      <DealerTabs
        tabs={[
          {
            key: "general",
            label: "General",
            content: (
              <div className="space-y-6">
                <div className="max-w-xl bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
                  <h2 className="font-medium mb-4">Store Info</h2>
                  <StoreForm store={store} />
                </div>
                <div>
                  <h2 className="font-medium mb-3">Schedule</h2>
                  <StoreScheduleEditor storeId={store.id} schedule={schedule ?? []} />
                </div>
                <div>
                  <h2 className="font-medium mb-3">Staff</h2>
                  <StoreStaffManager storeId={store.id} staff={staff ?? []} />
                </div>
              </div>
            ),
          },
          {
            key: "prices",
            label: "Price List",
            content: (
              <StorePriceOverrides
                storeId={store.id}
                products={products ?? []}
                overrides={overrides ?? []}
                fxRate={store.fx_rate_to_eur}
                currency={store.currency}
              />
            ),
          },
          { key: "plan", label: "Sales Plan", content: <StoreSalesPlanEditor storeId={store.id} plans={plans ?? []} currency={store.currency} fxRate={fxRate} /> },
          { key: "inventory", label: "Inventory", content: <StoreInventoryTable stock={stockWithValue} currency={store.currency} fxRate={fxRate} /> },
          { key: "deliveries", label: "Deliveries", content: <StoreDeliveryManager storeId={store.id} products={products ?? []} deliveries={deliveriesWithCount} /> },
          {
            key: "reports",
            label: "Daily Reports",
            content: (
              <div className="space-y-6">
                <StoreWeeklyFocusEditor storeId={store.id} weekStart={weekStart} weekEnd={weekEnd} focus={focus} editable />
                <div className="hidden md:block">
                  <h2 className="font-medium mb-3">Add / Correct a Report</h2>
                  <AdminDailyReportEditor
                    storeId={store.id}
                    currency={store.currency}
                    fxRate={fxRate}
                    schedule={schedule ?? []}
                    plans={plans ?? []}
                    products={priceList}
                  />
                </div>
                <div className="hidden md:block">
                  <h2 className="font-medium mb-3">History</h2>
                  <StoreDailyReportsHistory rows={reportRows} currency={store.currency} />
                </div>
              </div>
            ),
          },
        ]}
      />
    </AppShell>
  );
}
