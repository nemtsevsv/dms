import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import OrderItemsManager from "@/components/OrderItemsManager";
import OrderStatusSelect from "@/components/OrderStatusSelect";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderCardPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, dealers(id, company_name)")
    .eq("id", params.id)
    .single();
  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", params.id)
    .order("created_at");

  return (
    <AppShell>
      <Link href="/orders" className="text-sm text-slate-500 hover:underline">
        ← Все заказы
      </Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="text-xl font-semibold">{order.order_number}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Дилер:{" "}
            <Link href={`/dealers/${order.dealers?.id}`} className="hover:underline">
              {order.dealers?.company_name}
            </Link>{" "}
            · {order.order_date} · {order.currency}
          </p>
        </div>
        <OrderStatusSelect orderId={order.id} status={order.status} />
      </div>

      <OrderItemsManager orderId={order.id} items={items ?? []} currency={order.currency} />
    </AppShell>
  );
}
