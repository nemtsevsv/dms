import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CountryTable from "@/components/CountryTable";
import CountriesOverviewWidgets from "@/components/CountriesOverviewWidgets";

export const dynamic = "force-dynamic";

export default async function CountriesPage() {
  const supabase = createClient();
  const [{ data: countries }, { data: tradeRows }, { data: dealers }] = await Promise.all([
    supabase.from("countries").select("id, name, capital, biggest_cities, population, gdp, gdp_ppp, hnwi, vat").order("name"),
    supabase.from("trade_data").select("exporting_country, importing_country, flow, product_group, year, value"),
    supabase.from("dealers").select("country, status"),
  ]);

  const POTENTIAL_STATUSES = ["New", "First Contact", "Negotiation", "Contract Signing"];
  const dealerCountsByCountry = new Map<string, { active: number; potential: number }>();
  for (const d of dealers ?? []) {
    if (!d.country) continue;
    const entry = dealerCountsByCountry.get(d.country) ?? { active: 0, potential: 0 };
    if (d.status === "Active") entry.active++;
    else if (POTENTIAL_STATUSES.includes(d.status)) entry.potential++;
    dealerCountsByCountry.set(d.country, entry);
  }

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Region</h1>
      <CountriesOverviewWidgets countries={countries ?? []} tradeRows={tradeRows ?? []} />
      <CountryTable countries={countries ?? []} dealerCounts={Object.fromEntries(dealerCountsByCountry)} />
    </AppShell>
  );
}
