import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CountryTable from "@/components/CountryTable";
import CountriesOverviewWidgets from "@/components/CountriesOverviewWidgets";
import Link from "next/link";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CountriesPage() {
  const supabase = createClient();
  const [{ data: countries }, { data: tradeRows }] = await Promise.all([
    supabase.from("countries").select("id, name, capital, biggest_cities, population, gdp, gdp_ppp, hnwi, vat").order("name"),
    supabase.from("trade_data").select("exporting_country, importing_country, flow, product_group, year, value"),
  ]);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Countries</h1>
        <Link href="/countries/hs-codes" className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50">
          <Settings size={14} />
          HS Codes
        </Link>
      </div>
      <CountriesOverviewWidgets countries={countries ?? []} tradeRows={tradeRows ?? []} />
      <CountryTable countries={countries ?? []} />
    </AppShell>
  );
}
