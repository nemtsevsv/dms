import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import OrdersList from "@/components/OrdersList";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, order_date, currency, dealers(id, company_name), order_items(total, status)")
    .order("order_date", { ascending: false });

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Orders</h1>
      <OrdersList orders={(orders as any) ?? []} />
    </AppShell>
  );
}
