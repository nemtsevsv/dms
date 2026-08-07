import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import MarketingActivityTable from "@/components/MarketingActivityTable";

export const dynamic = "force-dynamic";

export default async function MarketingActivitiesPage() {
  const supabase = createClient();

  const { data: activities } = await supabase
    .from("marketing_activities")
    .select("id, name, activity_type, status, start_date, end_date, country, budget_planned, currency, stores(name), dealers(company_name)")
    .order("start_date", { ascending: false });

  const rows = (activities ?? []).map((a: any) => ({
    id: a.id,
    name: a.name,
    activity_type: a.activity_type,
    status: a.status,
    start_date: a.start_date,
    end_date: a.end_date,
    country: a.country,
    store_name: a.stores?.name ?? null,
    dealer_name: a.dealers?.company_name ?? null,
    budget_planned: a.budget_planned,
    currency: a.currency,
  }));

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Marketing Activities</h1>
      <MarketingActivityTable activities={rows} />
    </AppShell>
  );
}
