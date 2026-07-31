import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import OrdersList from "@/components/OrdersList";
import FiscalYearBadge from "@/components/FiscalYearBadge";
import { computeItemStatus } from "@/lib/orderItemStatus";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, order_date, currency, dealers(id, company_name), order_items(id, quantity, total)")
    .order("order_date", { ascending: false });

  const allItemIds = (orders ?? []).flatMap((o: any) => o.order_items.map((i: any) => i.id));
  const invoicedQtyByItem: Record<string, number> = {};
  if (allItemIds.length > 0) {
    const { data: invItems } = await supabase
      .from("invoice_items")
      .select("order_item_id, quantity, invoices!inner(status)")
      .in("order_item_id", allItemIds)
      .neq("invoices.status", "Cancelled");
    for (const row of invItems ?? []) {
      if (!row.order_item_id) continue;
      invoicedQtyByItem[row.order_item_id] = (invoicedQtyByItem[row.order_item_id] ?? 0) + (Number(row.quantity) || 0);
    }
  }

  const ordersWithStatus = (orders ?? []).map((o: any) => {
    let total = 0;
    let waitingCount = 0;
    for (const item of o.order_items) {
      const s = computeItemStatus(item.quantity, invoicedQtyByItem[item.id] ?? 0, o.status);
      if (s.label !== "Cancelled") total += Number(item.total) || 0;
      if (s.waitingQty > 0) waitingCount += 1;
    }
    return { ...o, computedTotal: total, waitingCount };
  });

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Orders</h1>
        <FiscalYearBadge />
      </div>
      <OrdersList orders={ordersWithStatus} />
    </AppShell>
  );
}
