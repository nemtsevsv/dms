import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CountryDashboardRefreshButton from "@/components/CountryDashboardRefreshButton";
import { ALL_COUNTRY_FIELDS } from "@/lib/countryDashboardFields";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function fmtValue(v: number | null) {
  if (v === null || v === undefined) return "N/A";
  return v.toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

export default async function CountryDashboardDetailPage({ params }: { params: { iso2: string } }) {
  const supabase = createClient();
  const iso2 = params.iso2.toUpperCase();

  const { data: country, error } = await supabase.from("country_master").select("*").eq("iso2", iso2).single();
  if (error || !country) {
    console.error("[country-dashboard/[iso2]] failed to load country", { iso2, error });
    notFound();
  }

  const { data: points } = await supabase
    .from("country_data_points")
    .select("data_field, year, value, text_value, retrieved_at, source")
    .eq("iso2", iso2)
    .order("retrieved_at", { ascending: false });

  // Latest retrieval wins per (field, year) — history is never overwritten
  // in storage, but the dashboard always shows the most recent observation.
  const latest = new Map<string, { value: number | null; text_value: string | null; retrieved_at: string; source: string }>();
  for (const p of points ?? []) {
    const k = `${p.data_field}__${p.year ?? "current"}`;
    if (!latest.has(k)) latest.set(k, p);
  }
  const lastRetrievedAt = (points ?? [])[0]?.retrieved_at ?? null;

  const now = new Date();
  const lastFullYear = now.getFullYear() - 1;
  const yearMinus1 = lastFullYear - 1;
  const yearMinus2 = lastFullYear - 2;
  const ytdYear = now.getFullYear();

  const columns = [
    { label: String(yearMinus2), year: yearMinus2 },
    { label: String(yearMinus1), year: yearMinus1 },
    { label: `${lastFullYear} (Last Full Year)`, year: lastFullYear },
    { label: `YTD ${ytdYear}`, year: null }, // "current" bucket — cities are stored with year=null
  ];

  return (
    <AppShell>
      <Link href="/country-dashboard" className="text-sm text-slate-500 hover:underline">
        ← All countries
      </Link>
      <div className="flex items-center justify-between mt-2 mb-1 flex-wrap gap-2">
        <h1 className="text-xl font-semibold">{country.country_en}</h1>
        <CountryDashboardRefreshButton iso2={iso2} />
      </div>
      <p className="text-sm text-slate-500 mb-1">
        {country.iso2} · Capital: {country.capital ?? "—"} · Currency: {country.currency ?? "—"} · Continent: {country.continent_en ?? "—"}
      </p>
      <p className="text-sm text-slate-500 mb-4">Languages: {country.languages_en ?? "—"}</p>
      <p className="text-xs text-slate-400 mb-4">
        {lastRetrievedAt ? `Last retrieved ${new Date(lastRetrievedAt).toLocaleString()}` : "No data retrieved yet — press Refresh."}
      </p>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2.5">Data</th>
              {columns.map((c) => (
                <th key={c.label} className="text-right px-3 py-2.5 whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_COUNTRY_FIELDS.map((field) => (
              <tr key={field.key} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-700">
                  {field.label} <span className="text-slate-400 text-xs">({field.unit})</span>
                </td>
                {columns.map((c) => {
                  // "Current only" fields (cities) have no year — they only
                  // ever populate the right-most (YTD/current) column.
                  const key = field.isText || field.source === "geonames" ? `${field.key}__current` : `${field.key}__${c.year}`;
                  const isCityColumn = field.source === "geonames" && c.year !== null;
                  if (isCityColumn) return <td key={c.label} className="px-3 py-2 text-right text-slate-300">—</td>;
                  const row = latest.get(key);
                  const display = field.isText ? row?.text_value ?? "N/A" : fmtValue(row?.value ?? null);
                  return (
                    <td key={c.label} className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
