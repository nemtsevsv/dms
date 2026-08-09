"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Country = { iso2: string; country_en: string; capital: string | null; continent_en: string | null };

export default function CountryDashboardList({ countries }: { countries: Country[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => countries.filter((c) => c.country_en.toLowerCase().includes(search.toLowerCase()) || c.iso2.toLowerCase() === search.toLowerCase()),
    [countries, search]
  );

  return (
    <div>
      <input
        placeholder="Search by country name or ISO2..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-72 mb-4 focus:outline-none focus:ring-2 focus:ring-slate-300"
      />
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2.5">ISO2</th>
              <th className="text-left px-3 py-2.5">Country</th>
              <th className="text-left px-3 py-2.5">Capital</th>
              <th className="text-left px-3 py-2.5">Continent</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.iso2} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-500 font-mono text-xs">{c.iso2}</td>
                <td className="px-3 py-2">
                  <Link href={`/country-dashboard/${c.iso2}`} className="font-medium hover:underline">
                    {c.country_en}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{c.capital ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600">{c.continent_en ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-400">
                  No countries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
