import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CountryOverview from "@/components/CountryOverview";
import DeleteCountryButton from "@/components/DeleteCountryButton";
import CountryTradeOverview from "@/components/CountryTradeOverview";
import CountryImportChart from "@/components/CountryImportChart";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CountryPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: country, error } = await supabase.from("countries").select("*").eq("id", params.id).single();
  if (error || !country) {
    console.error("[countries/[id]] failed to load country", { id: params.id, error });
    notFound();
  }

  const { data: tradeRows } = await supabase
    .from("trade_data")
    .select("*")
    .or(`exporting_country.eq.${country.name},importing_country.eq.${country.name}`)
    .order("year", { ascending: false });

  return (
    <AppShell>
      <Link href="/countries" className="text-sm text-slate-500 hover:underline">
        ← All countries
      </Link>
      <div className="flex items-center justify-between mt-2 mb-6 flex-wrap gap-2">
        <h1 className="text-xl font-semibold">{country.name}</h1>
        <DeleteCountryButton countryId={country.id} />
      </div>

      <CountryOverview country={country} />

      <div className="mb-6">
        <CountryImportChart countryName={country.name} rows={(tradeRows ?? []) as any} />
      </div>

      <div>
        <h2 className="font-medium mb-4">Trade Overview</h2>
        <CountryTradeOverview countryId={country.id} countryName={country.name} rows={tradeRows ?? []} />
      </div>
    </AppShell>
  );
}
