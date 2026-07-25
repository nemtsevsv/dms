import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import OrderItemsManager from "@/components/OrderItemsManager";
import OrderStatusSelect from "@/components/OrderStatusSelect";
import OrderNumberEdit from "@/components/OrderNumberEdit";
import CreateInvoiceButton from "@/components/CreateInvoiceButton";
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

  const { data: products } = await supabase
    .from("products")
    .select("sku, product_name, list_price")
    .order("product_name");

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, invoice_date, status")
    .eq("order_id", params.id)
    .order("created_at", { ascending: false });

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
            · {order.order_date} · {order.currency} · Discount: {dealerDiscount}%
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CreateInvoiceButton
            orderId={order.id}
            orderNumber={order.order_number}
            dealerId={order.dealers?.id}
            dealerName={order.dealers?.company_name}
            currency={order.currency}
            items={items ?? []}
          />
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </div>
      </div>

      {invoices && invoices.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {invoices.map((inv) => (
            <Link
              key={inv.id}
              href={`/invoices/${inv.id}`}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              {inv.invoice_number} · {inv.status}
            </Link>
          ))}
        </div>
      )}

      <OrderItemsManager
        orderId={order.id}
        items={items ?? []}
        currency={order.currency}
        products={products ?? []}
        dealerDiscount={dealerDiscount}
      />
    </AppShell>
  );
}
