import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import DealerTable from "@/components/DealerTable";

export const dynamic = "force-dynamic";

export default async function DealersPage() {
  const supabase = createClient();
  const { data: dealers } = await supabase
    .from("dealers")
    .select("id, status, company_name, country, city, annual_sales_plan")
    .order("company_name");

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Dealers</h1>
      <DealerTable dealers={dealers ?? []} />
    </AppShell>
  );
}
