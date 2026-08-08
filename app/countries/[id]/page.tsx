import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CountryForm from "@/components/CountryForm";
import DeleteCountryButton from "@/components/DeleteCountryButton";
import TradeDataImport from "@/components/TradeDataImport";
import CountryTradeOverview from "@/components/CountryTradeOverview";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function fmt(n: number | null, digits = 0) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("de-DE", { maximumFractionDigits: digits });
}

function growthLabel(n: number | null) {
  if (n === null || n === undefined) return null;
  return `${n > 0 ? "+" : ""}${n}%/yr`;
}

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

  const gdpPerCapita = country.population && country.gdp ? country.gdp / country.population : null;
  const gdpPppPerCapita = country.population && country.gdp_ppp ? country.gdp_ppp / country.population : null;
  const hnwiRatio = country.population && country.hnwi ? (country.hnwi / country.population) * 100 : null;

  const stats = [
    { label: "Area", value: country.area ? `${fmt(country.area)} km²` : "—" },
    { label: "Population", value: fmt(country.population), sub: growthLabel(country.population_growth_rate) },
    { label: "GDP", value: country.gdp ? `${fmt(country.gdp)} USD` : "—", sub: growthLabel(country.gdp_growth_rate) },
    { label: "GDP / capita", value: gdpPerCapita ? `${fmt(gdpPerCapita)} USD` : "—" },
    { label: "GDP (PPP)", value: country.gdp_ppp ? `${fmt(country.gdp_ppp)} intl.$` : "—", sub: growthLabel(country.gdp_ppp_growth_rate) },
    { label: "GDP PPP / capita", value: gdpPppPerCapita ? `${fmt(gdpPppPerCapita)} intl.$` : "—" },
    { label: "HNWI", value: fmt(country.hnwi), sub: hnwiRatio !== null ? `${hnwiRatio.toFixed(3)}% of population` : null },
    { label: "VAT", value: country.vat !== null ? `${country.vat}%` : "—" },
  ];

  return (
    <AppShell>
      <Link href="/countries" className="text-sm text-slate-500 hover:underline">
        ← All countries
      </Link>
      <div className="flex items-center justify-between mt-2 mb-6 flex-wrap gap-2">
        <h1 className="text-xl font-semibold">{country.name}</h1>
        <DeleteCountryButton countryId={country.id} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
            <div className="text-xs text-slate-400 mb-1">{s.label}</div>
            <div className="text-base font-semibold text-slate-800">{s.value}</div>
            {s.sub && <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>}
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
        <h2 className="font-medium mb-4">Edit Country Data</h2>
        <CountryForm country={country} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
        <h2 className="font-medium mb-1">Trade Data (HS Code Export/Import)</h2>
        <p className="text-xs text-slate-400 mb-4">Upload a file to add trade records for {country.name} — rows where it appears as either the exporting or importing country.</p>
        <TradeDataImport />
      </div>

      <div>
        <h2 className="font-medium mb-4">Trade Overview</h2>
        <CountryTradeOverview countryName={country.name} rows={tradeRows ?? []} />
      </div>
    </AppShell>
  );
}
