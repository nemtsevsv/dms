import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CountryTable from "@/components/CountryTable";

export const dynamic = "force-dynamic";

export default async function CountriesPage() {
  const supabase = createClient();
  const { data: countries } = await supabase.from("countries").select("id, name, population, gdp, gdp_ppp, vat").order("name");

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Countries</h1>
      <CountryTable countries={countries ?? []} />
    </AppShell>
  );
}
