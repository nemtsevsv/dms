import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CountryTable from "@/components/CountryTable";
import CountriesOverviewWidgets from "@/components/CountriesOverviewWidgets";

export const dynamic = "force-dynamic";

export default async function CountriesPage() {
  const supabase = createClient();
  const [{ data: countries }, { data: tradeRows }] = await Promise.all([
    supabase.from("countries").select("id, name, capital, biggest_cities, population, gdp, gdp_ppp, hnwi, vat").order("name"),
    supabase.from("trade_data").select("exporting_country, importing_country, flow, product_group, year, value"),
  ]);

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Countries</h1>
      <CountriesOverviewWidgets countries={countries ?? []} tradeRows={tradeRows ?? []} />
      <CountryTable countries={countries ?? []} />
    </AppShell>
  );
}
