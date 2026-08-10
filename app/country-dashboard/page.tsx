import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CountryDashboardApp from "@/components/CountryDashboardApp";

export const dynamic = "force-dynamic";

export default async function CountryDashboardPage() {
  const supabase = createClient();
  const { data: countries } = await supabase
    .from("country_master")
    .select("iso2, country_en, country_de, continent_en, continent_de, languages_en, languages_de, language_codes, capital, currency, official_languages, regional_official_languages")
    .order("country_en");

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-1">Country Dashboard</h1>
      <p className="text-xs text-slate-400 mb-6">
        Select a country to see its data — standardized facts only, from Country_Master_Extended_Filled and live data sources. No scoring, no comparisons, no export.
      </p>
      <CountryDashboardApp countries={countries ?? []} />
    </AppShell>
  );
}
