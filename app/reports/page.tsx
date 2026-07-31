import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import DealerTabs from "@/components/DealerTabs";
import SalesReport from "./SalesReport";
import DealerNetworkReport from "./DealerNetworkReport";
import DealerRatings from "./DealerRatings";
import FiscalYearBadge from "@/components/FiscalYearBadge";
import { buildAuthorNameMap, resolveAuthor } from "@/lib/userNames";
import { getFiscalQuarterBounds, getCurrentFiscalYearBounds } from "@/lib/fiscalYear";

export const dynamic = "force-dynamic";

const STALE_THRESHOLDS: Record<string, number> = {
  "First Contact": 45,
  Negotiation: 60,
  "Contract Signing": 30,
};

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function ReportsPage() {
  const supabase = createClient();

  const { data: dealers } = await supabase
    .from("dealers")
    .select("id, company_name, country, assigned_manager, status, status_changed_at, created_at, annual_sales_plan");
  const { data: profiles } = await supabase.from("profiles").select("email, first_name, last_name");
  const authorNames = buildAuthorNameMap(profiles ?? []);

  const dealerById = new Map((dealers ?? []).map((d) => [d.id, d]));

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, order_date, status, currency, dealer_id, order_items(id, quantity, total)")
    .order("order_date", { ascending: false });

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, invoice_date, status, currency, dealer_id, invoice_items(total)")
    .order("invoice_date", { ascending: false });

  const orderRows = (orders ?? []).map((o: any) => {
    const d = dealerById.get(o.dealer_id);
    const total = o.order_items.reduce((s: number, item: any) => s + (Number(item.total) || 0), 0);
    return {
      id: o.id,
      order_number: o.order_number,
      order_date: o.order_date,
      status: o.status,
      currency: o.currency,
      dealer_name: d?.company_name ?? "—",
      country: d?.country ?? "—",
      manager: resolveAuthor(d?.assigned_manager, authorNames),
      total: o.status === "Cancelled" ? 0 : total,
    };
  });

  const invoiceRows = (invoices ?? []).map((i: any) => {
    const d = dealerById.get(i.dealer_id);
    const total = (i.invoice_items ?? []).reduce((s: number, it: any) => s + (Number(it.total) || 0), 0);
    return {
      id: i.id,
      invoice_number: i.invoice_number,
      invoice_date: i.invoice_date,
      status: i.status,
      currency: i.currency,
      dealer_name: d?.company_name ?? "—",
      country: d?.country ?? "—",
      manager: resolveAuthor(d?.assigned_manager, authorNames),
      total: i.status === "Cancelled" ? 0 : total,
    };
  });

  // ---- Dealer Ratings (Active dealers, current fiscal year actual sales) ----
  const { startStr: fyStart, endStr: fyEnd } = getCurrentFiscalYearBounds();
  const actualSalesByDealer = new Map<string, number>();
  for (const inv of invoices ?? []) {
    if (inv.status === "Cancelled") continue;
    if (inv.invoice_date < fyStart || inv.invoice_date > fyEnd) continue;
    const sum = (inv.invoice_items ?? []).reduce((s: number, it: any) => s + (Number(it.total) || 0), 0);
    actualSalesByDealer.set(inv.dealer_id, (actualSalesByDealer.get(inv.dealer_id) ?? 0) + sum);
  }
  const ratingDealers = (dealers ?? [])
    .filter((d) => d.status === "Active")
    .map((d) => ({
      id: d.id,
      company_name: d.company_name,
      country: d.country ?? "—",
      annual_sales_plan: Number(d.annual_sales_plan) || 0,
      actual_sales: actualSalesByDealer.get(d.id) ?? 0,
    }));

  // ---- Dealer Network Report ----
  const { data: history } = await supabase
    .from("dealer_history")
    .select("dealer_id, field_name, new_value, changed_at")
    .eq("field_name", "status")
    .order("changed_at", { ascending: true });

  const currentQ = getFiscalQuarterBounds(0);
  const prevQ = getFiscalQuarterBounds(1);

  const newDealersCurrentQ = (dealers ?? []).filter((d) => d.created_at >= currentQ.startStr && d.created_at <= currentQ.endStr + "T23:59:59").length;
  const newDealersPrevQ = (dealers ?? []).filter((d) => d.created_at >= prevQ.startStr && d.created_at <= prevQ.endStr + "T23:59:59").length;

  const activeEvents = (history ?? []).filter((h) => h.new_value === "Active");
  const signedCurrentQ = activeEvents.filter((h) => h.changed_at >= currentQ.startStr && h.changed_at <= currentQ.endStr + "T23:59:59").length;
  const signedPrevQ = activeEvents.filter((h) => h.changed_at >= prevQ.startStr && h.changed_at <= prevQ.endStr + "T23:59:59").length;

  // Avg time currently spent in each status (snapshot of dealers as they are today)
  const now = new Date();
  const byStatus = new Map<string, number[]>();
  for (const d of dealers ?? []) {
    if (!d.status_changed_at) continue;
    const days = daysBetween(new Date(d.status_changed_at), now);
    byStatus.set(d.status, [...(byStatus.get(d.status) ?? []), days]);
  }
  const avgTimeInStatus = Array.from(byStatus.entries()).map(([status, daysList]) => ({
    status,
    avgDays: Math.round(daysList.reduce((s, d) => s + d, 0) / daysList.length),
    count: daysList.length,
  }));

  // First-Contact date per dealer (earliest time they entered that status)
  const firstContactDate = new Map<string, Date>();
  const firstSigningDate = new Map<string, Date>();
  for (const h of history ?? []) {
    if (h.new_value === "First Contact" && !firstContactDate.has(h.dealer_id)) {
      firstContactDate.set(h.dealer_id, new Date(h.changed_at));
    }
  }
  for (const h of history ?? []) {
    if (h.new_value === "Contract Signing" && !firstSigningDate.has(h.dealer_id)) {
      const fc = firstContactDate.get(h.dealer_id);
      if (fc && new Date(h.changed_at) >= fc) firstSigningDate.set(h.dealer_id, new Date(h.changed_at));
    }
  }
  const signingDurations: number[] = [];
  for (const [dealerId, fc] of firstContactDate) {
    const sign = firstSigningDate.get(dealerId);
    if (sign) signingDurations.push(daysBetween(fc, sign));
  }
  const avgFirstContactToSigning = signingDurations.length
    ? Math.round(signingDurations.reduce((s, d) => s + d, 0) / signingDurations.length)
    : null;

  const firstOrderDate = new Map<string, Date>();
  for (const o of orders ?? []) {
    const existing = firstOrderDate.get(o.dealer_id);
    const d = new Date(o.order_date);
    if (!existing || d < existing) firstOrderDate.set(o.dealer_id, d);
  }
  const orderDurations: number[] = [];
  for (const [dealerId, fc] of firstContactDate) {
    const firstOrder = firstOrderDate.get(dealerId);
    if (firstOrder && firstOrder >= fc) orderDurations.push(daysBetween(fc, firstOrder));
  }
  const avgFirstContactToFirstOrder = orderDurations.length
    ? Math.round(orderDurations.reduce((s, d) => s + d, 0) / orderDurations.length)
    : null;

  // Dealers stuck in a status longer than the healthy threshold
  const staleGroups = Object.entries(STALE_THRESHOLDS).map(([status, thresholdDays]) => {
    const stuck = (dealers ?? [])
      .filter((d) => d.status === status && d.status_changed_at)
      .map((d) => ({ id: d.id, company_name: d.company_name, days: daysBetween(new Date(d.status_changed_at), now) }))
      .filter((d) => d.days > thresholdDays)
      .sort((a, b) => b.days - a.days);
    return { status, thresholdDays, dealers: stuck };
  });

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Reports</h1>
        <FiscalYearBadge />
      </div>
      <DealerTabs
        tabs={[
          {
            key: "sales",
            label: "Sales Report",
            content: <SalesReport orders={orderRows} invoices={invoiceRows} />,
          },
          {
            key: "network",
            label: "Dealer Network Report",
            content: (
              <DealerNetworkReport
                dealers={(dealers ?? []).map((d) => ({ status: d.status }))}
                newDealersCurrentQ={newDealersCurrentQ}
                newDealersPrevQ={newDealersPrevQ}
                signedCurrentQ={signedCurrentQ}
                signedPrevQ={signedPrevQ}
                currentQLabel={currentQ.label}
                prevQLabel={prevQ.label}
                avgTimeInStatus={avgTimeInStatus}
                avgFirstContactToSigning={avgFirstContactToSigning}
                avgFirstContactToFirstOrder={avgFirstContactToFirstOrder}
                staleGroups={staleGroups}
              />
            ),
          },
          {
            key: "ratings",
            label: "Dealer Ratings",
            content: <DealerRatings dealers={ratingDealers} />,
          },
        ]}
      />
    </AppShell>
  );
}
