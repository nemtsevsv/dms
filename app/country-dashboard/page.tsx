import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CountryDashboardList from "@/components/CountryDashboardList";
import CountryDashboardBulkRefresh from "@/components/CountryDashboardBulkRefresh";

export const dynamic = "force-dynamic";

export default async function CountryDashboardPage() {
  const supabase = createClient();
  const { data: countries } = await supabase.from("country_master").select("iso2, country_en, capital, continent_en").order("country_en");

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Country Dashboard</h1>
        <CountryDashboardBulkRefresh countries={countries ?? []} />
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Standardized facts only, retrieved from World Bank, GeoNames and Eurostat Comext. No scoring, no recommendations — select a country to see its data.
      </p>
      <CountryDashboardList countries={countries ?? []} />
    </AppShell>
  );
}
