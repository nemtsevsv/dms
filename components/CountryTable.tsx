"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { btnPrimary } from "@/lib/buttonStyles";

type Country = {
  id: string;
  name: string;
  population: number | null;
  gdp: number | null;
  gdp_ppp: number | null;
  vat: number | null;
};

function perCapita(total: number | null, population: number | null) {
  if (!total || !population) return null;
  return total / population;
}

function fmt(n: number | null, digits = 0) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("de-DE", { maximumFractionDigits: digits });
}

export default function CountryTable({ countries }: { countries: Country[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => countries.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)),
    [countries, search]
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          placeholder="Search countries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <Link href="/countries/new" className={btnPrimary + " sm:ml-auto"}>
          + New Country
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2.5">Name</th>
              <th className="text-right px-3 py-2.5">Population</th>
              <th className="text-right px-3 py-2.5">GDP (USD)</th>
              <th className="text-right px-3 py-2.5">GDP / capita</th>
              <th className="text-right px-3 py-2.5">GDP PPP</th>
              <th className="text-right px-3 py-2.5">GDP PPP / capita</th>
              <th className="text-right px-3 py-2.5">VAT</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/countries/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-right text-slate-600">{fmt(c.population)}</td>
                <td className="px-3 py-2 text-right text-slate-600">{fmt(c.gdp)}</td>
                <td className="px-3 py-2 text-right text-slate-600">{fmt(perCapita(c.gdp, c.population))}</td>
                <td className="px-3 py-2 text-right text-slate-600">{fmt(c.gdp_ppp)}</td>
                <td className="px-3 py-2 text-right text-slate-600">{fmt(perCapita(c.gdp_ppp, c.population))}</td>
                <td className="px-3 py-2 text-right text-slate-600">{c.vat !== null ? `${c.vat}%` : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
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
