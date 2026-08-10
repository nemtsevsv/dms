"use client";

import { useState } from "react";
import { ALL_COUNTRY_FIELDS } from "@/lib/countryDashboardFields";

type CountryMaster = {
  iso2: string;
  country_en: string;
  country_de: string | null;
  continent_en: string | null;
  continent_de: string | null;
  languages_en: string | null;
  languages_de: string | null;
  language_codes: string | null;
  capital: string | null;
  currency: string | null;
  official_languages: string | null;
  regional_official_languages: string | null;
};

type Point = { data_field: string; year: number | null; value: number | null; text_value: string | null };

function fmtValue(v: number | null) {
  if (v === null || v === undefined) return "N/A";
  return v.toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

function StaticField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm text-slate-800">{value || "—"}</div>
    </div>
  );
}

export default function CountryDashboardApp({ countries }: { countries: CountryMaster[] }) {
  const [selectedIso2, setSelectedIso2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[] | null>(null);
  const [retrievedAt, setRetrievedAt] = useState<Date | null>(null);

  const country = countries.find((c) => c.iso2 === selectedIso2) ?? null;

  async function handleSelect(iso2: string) {
    setSelectedIso2(iso2);
    setPoints(null);
    setError(null);
    if (!iso2) return;

    // Static data (above) comes straight from the `countries` prop already
    // in memory — no request needed, so it appears instantly. Dynamic data
    // is requested here, in parallel with that instant static render, and
    // fills in as soon as it arrives — always freshly reloaded per
    // selection, never shown stale from a previous country.
    setLoading(true);
    try {
      const res = await fetch("/api/country-dashboard/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iso2 }),
      });
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        json = { error: `Server returned an unexpected response (HTTP ${res.status}): ${text.slice(0, 200)}` };
      }
      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to load data");
      } else {
        setPoints(json.points ?? []);
        setRetrievedAt(new Date());
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  const latest = new Map<string, Point>();
  for (const p of points ?? []) {
    const k = `${p.data_field}__${p.year ?? "current"}`;
    if (!latest.has(k)) latest.set(k, p);
  }

  const now = new Date();
  const lastFullYear = now.getFullYear() - 1;
  const yearMinus1 = lastFullYear - 1;
  const yearMinus2 = lastFullYear - 2;
  const columns = [
    { label: String(yearMinus2), year: yearMinus2 },
    { label: String(yearMinus1), year: yearMinus1 },
    { label: `${lastFullYear} (Last Full Year)`, year: lastFullYear },
    { label: `YTD ${now.getFullYear()}`, year: null },
  ];

  return (
    <div>
      <div className="mb-6">
        <label className="block text-xs font-medium text-slate-500 mb-1">Select Country (ISO2)</label>
        <select
          value={selectedIso2}
          onChange={(e) => handleSelect(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <option value="">— Select a country —</option>
          {countries
            .slice()
            .sort((a, b) => a.country_en.localeCompare(b.country_en))
            .map((c) => (
              <option key={c.iso2} value={c.iso2}>
                {c.iso2} — {c.country_en}
              </option>
            ))}
        </select>
      </div>

      {!selectedIso2 && <p className="text-sm text-slate-400">Select a country above to see its data.</p>}

      {country && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Static Data</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StaticField label="ISO2" value={country.iso2} />
              <StaticField label="Country (EN)" value={country.country_en} />
              <StaticField label="Country (German)" value={country.country_de} />
              <StaticField label="Continent (EN)" value={country.continent_en} />
              <StaticField label="Continent (German)" value={country.continent_de} />
              <StaticField label="Languages (EN)" value={country.languages_en} />
              <StaticField label="Languages (German)" value={country.languages_de} />
              <StaticField label="Language Codes" value={country.language_codes} />
              <StaticField label="Capital" value={country.capital} />
              <StaticField label="Currency" value={country.currency} />
              <StaticField label="Official Languages" value={country.official_languages} />
              <StaticField label="Regional Official Languages" value={country.regional_official_languages} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dynamic Data</h2>
              <span className="text-xs text-slate-400">
                {loading ? "Loading..." : error ? <span className="text-red-600">{error}</span> : retrievedAt ? `Retrieved ${retrievedAt.toLocaleTimeString()}` : ""}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2.5">Data Field</th>
                  <th className="text-left px-3 py-2.5">Unit</th>
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
                    <td className="px-3 py-2 text-slate-700">{field.label}</td>
                    <td className="px-3 py-2 text-slate-400 text-xs">{field.unit}</td>
                    {columns.map((c) => {
                      if (field.source === "manual") return <td key={c.label} className="px-3 py-2 text-right text-slate-300">N/A</td>;
                      const isCityColumn = field.source === "geonames" && c.year !== null;
                      if (isCityColumn) return <td key={c.label} className="px-3 py-2 text-right text-slate-300">—</td>;
                      const key = field.isText || field.source === "geonames" ? `${field.key}__current` : `${field.key}__${c.year}`;
                      const row = latest.get(key);
                      const display = loading ? "…" : field.isText ? row?.text_value ?? "N/A" : fmtValue(row?.value ?? null);
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
        </div>
      )}
    </div>
  );
}
