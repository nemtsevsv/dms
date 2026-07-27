import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import OrderItemsManager from "@/components/OrderItemsManager";
import OrderStatusSelect from "@/components/OrderStatusSelect";
import OrderNumberEdit from "@/components/OrderNumberEdit";
import OrderDateEdit from "@/components/OrderDateEdit";
import CreateInvoiceButton from "@/components/CreateInvoiceButton";
import DeleteOrderButton from "@/components/DeleteOrderButton";
import CreatedByLine from "@/components/CreatedByLine";
import { buildAuthorNameMap } from "@/lib/userNames";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const invoiceStatusColors: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600 border-slate-300",
  Sent: "bg-blue-100 text-blue-700 border-blue-300",
  Paid: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Cancelled: "bg-red-100 text-red-700 border-red-300",
};

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 mb-6">
        <div>
          <OrderNumberEdit orderId={order.id} orderNumber={order.order_number} />
          <p className="text-sm text-slate-500 mt-1">
            Dealer:{" "}
            <Link href={`/dealers/${order.dealers?.id}`} className="hover:underline">
              {order.dealers?.company_name}
            </Link>{" "}
            · <OrderDateEdit orderId={order.id} orderDate={order.order_date} /> · {order.currency} · Discount: {dealerDiscount}%
          </p>
          <CreatedByLine createdAt={order.created_at} createdBy={order.created_by} authorNames={authorNames} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CreateInvoiceButton
            orderId={order.id}
            orderNumber={order.order_number}
            dealerId={order.dealers?.id}
            currency={order.currency}
            items={items ?? []}
            invoicedQtyByItem={invoicedQtyByItem}
            orderStatus={order.status}
          />
          <OrderStatusSelect orderId={order.id} status={order.status} />
          <DeleteOrderButton orderId={order.id} />
        </div>
      </div>

      {invoices && invoices.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {invoices.map((inv) => (
            <Link
              key={inv.id}
              href={`/invoices/${inv.id}`}
              className={`text-sm px-3 py-1.5 rounded-lg border ${invoiceStatusColors[inv.status] ?? "border-slate-300"}`}
            >
              {inv.invoice_number} · {inv.status}
            </Link>
          ))}
        </div>
      )}

      {order.status === "Cancelled" && (
        <p className="text-sm text-red-600 mb-4">This order is cancelled — all items are shown as Cancelled.</p>
      )}
      {order.status === "Completed" && (
        <p className="text-sm text-blue-600 mb-4">
          This order is completed — any quantity that was never invoiced is now treated as cancelled.
        </p>
      )}

      <OrderItemsManager
        orderId={order.id}
        orderStatus={order.status}
        items={items ?? []}
        invoicedQtyByItem={invoicedQtyByItem}
        currency={order.currency}
        products={products ?? []}
        dealerDiscount={dealerDiscount}
      />
    </AppShell>
  );
}
