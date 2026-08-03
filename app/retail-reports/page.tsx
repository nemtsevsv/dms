import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import StoreShell from "@/components/store/StoreShell";
import { getStoreAccess } from "@/lib/storeAccess";
import { getFiscalYearRange } from "@/lib/fiscalYear";
import { toDateStr } from "@/lib/isoWeek";
import RetailReportsClient from "./RetailReportsClient";

export const dynamic = "force-dynamic";

export default async function RetailReportsPage() {
  const access = await getStoreAccess();
  const supabase = createClient();
  const { start: fyStart, label: fyLabel } = getFiscalYearRange();
  const fyStartStr = toDateStr(fyStart);

  // "Own store" tabs (Products Sales Report, Retail Performance) are scoped
  // to the caller's store for store staff; Store Ratings always covers every
  // store, for everyone — it's a cross-store leaderboard, not private data.
  let ownStoresQuery = supabase.from("stores").select("id, name, currency, fx_rate_to_eur").eq("status", "Active");
  if (access.isStoreStaff && access.storeId) {
    ownStoresQuery = ownStoresQuery.eq("id", access.storeId);
  }
  const { data: ownStores } = await ownStoresQuery;
  const { data: allStores } = await supabase.from("stores").select("id, name, currency, fx_rate_to_eur").eq("status", "Active");

  const ownStoreIds = (ownStores ?? []).map((s) => s.id);
  const allStoreIds = (allStores ?? []).map((s) => s.id);

  const [{ data: plans }, { data: dailyReports }, { data: traffic }, { data: receipts }, { data: stockValue }] = await Promise.all([
    supabase.from("store_sales_plan").select("store_id, year, month, plan_amount_local").in("store_id", allStoreIds),
    supabase.from("daily_reports").select("store_id, report_date, staff_count, weather, season, expected_visitors, expected_customers, self_evaluation, submitted_by").in("store_id", allStoreIds).gte("report_date", fyStartStr),
    supabase.from("store_traffic_events").select("store_id, event_type, customer_type, occurred_at, created_by").in("store_id", allStoreIds).gte("occurred_at", `${fyStartStr}T00:00:00Z`),
    supabase.from("store_receipts").select("store_id, occurred_at, created_by, store_receipt_items(sku, product_name, quantity, total, item_type)").in("store_id", allStoreIds).gte("occurred_at", `${fyStartStr}T00:00:00Z`),
    supabase.from("store_inventory_current").select("store_id, sku, quantity").in("store_id", allStoreIds),
  ]);

  // Resolve RSP for stock value (per store, using price overrides where set)
  const { data: products } = await supabase.from("products").select("sku, retail_price_incl_vat");
  const { data: overrides } = await supabase.from("store_price_overrides").select("store_id, sku, local_price");
  const productPriceMap = new Map((products ?? []).map((p) => [p.sku, p.retail_price_incl_vat ?? 0]));
  const overrideMap = new Map((overrides ?? []).map((o) => [`${o.store_id}-${o.sku}`, o.local_price]));
  const storeFxMap = new Map((allStores ?? []).map((s) => [s.id, s.fx_rate_to_eur || 1]));

  const stockValueByStore = new Map<string, number>();
  for (const row of stockValue ?? []) {
    const fx = storeFxMap.get(row.store_id) ?? 1;
    const overrideKey = `${row.store_id}-${row.sku}`;
    const localPrice = overrideMap.has(overrideKey) ? overrideMap.get(overrideKey)! : (productPriceMap.get(row.sku) ?? 0) * fx;
    stockValueByStore.set(row.store_id, (stockValueByStore.get(row.store_id) ?? 0) + Number(row.quantity) * localPrice);
  }

  const { data: storeUsers } = await supabase.from("store_users").select("email, display_name, store_id").in("store_id", allStoreIds);

  const bundle = {
    fyLabel,
    stores: (allStores ?? []).map((s) => ({ id: s.id, name: s.name, currency: s.currency, fxRate: s.fx_rate_to_eur || 1 })),
    ownStoreIds,
    sellerNames: Object.fromEntries((storeUsers ?? []).map((u) => [u.email, u.display_name || u.email])),
    plans: (plans ?? []).map((p) => ({ storeId: p.store_id, year: p.year, month: p.month, planLocal: p.plan_amount_local ?? 0 })),
    dailyReports: (dailyReports ?? []).map((r) => ({
      storeId: r.store_id,
      date: r.report_date,
      staffCount: r.staff_count,
      weather: r.weather,
      season: r.season,
      expectedVisitors: r.expected_visitors,
      expectedCustomers: r.expected_customers,
      selfEvaluation: r.self_evaluation,
      submittedBy: r.submitted_by,
    })),
    traffic: (traffic ?? []).map((t) => ({
      storeId: t.store_id,
      date: t.occurred_at.slice(0, 10),
      eventType: t.event_type as "visitor" | "call" | "test_drive",
      customerType: t.customer_type as "new" | "existing",
      createdBy: t.created_by,
    })),
    receipts: (receipts ?? []).map((r: any) => ({
      storeId: r.store_id,
      date: r.occurred_at.slice(0, 10),
      createdBy: r.created_by,
      items: (r.store_receipt_items ?? []).map((it: any) => ({
        sku: it.sku,
        productName: it.product_name,
        quantity: it.quantity,
        total: Number(it.total) || 0,
        itemType: it.item_type,
      })),
    })),
    stockValueByStore: Object.fromEntries(stockValueByStore),
  };

  const content = <RetailReportsClient bundle={bundle} isStoreStaff={access.isStoreStaff} />;

  if (access.isStoreStaff && access.storeId) {
    return (
      <StoreShell storeId={access.storeId} wide>
        {content}
      </StoreShell>
    );
  }
  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Retail Reports</h1>
      {content}
    </AppShell>
  );
}
