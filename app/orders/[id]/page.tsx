import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import OrderWorkspace from "@/components/OrderWorkspace";
import { buildAuthorNameMap } from "@/lib/userNames";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderCardPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, dealers(id, company_name, discount_percent)")
    .eq("id", params.id)
    .single();
  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", params.id)
    .order("created_at");

  const itemIds = (items ?? []).map((i) => i.id);
  const invoicedQtyByItem: Record<string, number> = {};
  if (itemIds.length > 0) {
    const { data: invItems } = await supabase
      .from("invoice_items")
      .select("order_item_id, quantity, invoices!inner(status)")
      .in("order_item_id", itemIds)
      .neq("invoices.status", "Cancelled");
    for (const row of invItems ?? []) {
      if (!row.order_item_id) continue;
      invoicedQtyByItem[row.order_item_id] = (invoicedQtyByItem[row.order_item_id] ?? 0) + (Number(row.quantity) || 0);
    }
  }

  const { data: products } = await supabase
    .from("products")
    .select("sku, product_name, list_price")
    .order("product_name");

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, invoice_date, status")
    .eq("order_id", params.id)
    .order("created_at", { ascending: false });

  const { data: profiles } = await supabase.from("profiles").select("email, first_name, last_name");
  const authorNames = buildAuthorNameMap(profiles ?? []);

  const dealerDiscount = order.dealers?.discount_percent ?? 0;

  return (
    <AppShell>
      <Link href="/orders" className="text-sm text-slate-500 hover:underline">
        ← All orders
      </Link>

      <OrderWorkspace
        order={order}
        items={items ?? []}
        invoicedQtyByItem={invoicedQtyByItem}
        products={products ?? []}
        dealerDiscount={dealerDiscount}
        invoices={invoices ?? []}
        authorNames={authorNames}
      />
    </AppShell>
  );
}
