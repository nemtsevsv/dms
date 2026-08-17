import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import OrderForm from "@/components/OrderForm";
import { getNextOrderNumber } from "@/lib/documentNumbering";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const supabase = createClient();
  const [{ data: dealers }, nextOrderNumber] = await Promise.all([
    supabase.from("dealers").select("id, company_name").order("company_name"),
    getNextOrderNumber(supabase),
  ]);

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">New Order</h1>
      {(!dealers || dealers.length === 0) && (
        <p className="text-sm text-amber-600 mb-4">
          Please add at least one dealer first, in the Dealers section.
        </p>
      )}
      <OrderForm dealers={dealers ?? []} defaultOrderNumber={nextOrderNumber} />
    </AppShell>
  );
}
