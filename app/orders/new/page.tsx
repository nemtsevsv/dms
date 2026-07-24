import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import OrderForm from "@/components/OrderForm";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const supabase = createClient();
  const { data: dealers } = await supabase.from("dealers").select("id, company_name").order("company_name");

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Новый заказ</h1>
      {(!dealers || dealers.length === 0) && (
        <p className="text-sm text-amber-600 mb-4">
          Сначала добавьте хотя бы одного дилера в разделе Dealers.
        </p>
      )}
      <OrderForm dealers={dealers ?? []} />
    </AppShell>
  );
}
