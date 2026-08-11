"use client";

import { useMemo, useState } from "react";
import ColumnFilterHeader from "./ColumnFilterHeader";

type CountryMaster = {
  iso2: string;
  country_en: string;
  continent_en: string | null;
  languages_en: string | null;
  capital: string | null;
  currency: string | null;
};

type SortKey = "iso2" | "country_en" | "continent_en" | "languages_en" | "capital" | "currency";

export default function CountryMasterTable({ countries, onSelect }: { countries: CountryMaster[]; onSelect: (iso2: string) => void }) {
  const [search, setSearch] = useState("");
  const [continentFilter, setContinentFilter] = useState<string[]>([]);
  const [currencyFilter, setCurrencyFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("country_en");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const continents = Array.from(new Set(countries.map((c) => c.continent_en).filter(Boolean))) as string[];
  const currencies = Array.from(new Set(countries.map((c) => c.currency).filter(Boolean))) as string[];

  function handleSort(key: SortKey, dir: "asc" | "desc") {
    setSortKey(key);
    setSortDir(dir);
  }

  const filtered = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return countries
      .filter((c) => c.country_en.toLowerCase().includes(search.toLowerCase()) || c.iso2.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => continentFilter.length === 0 || continentFilter.includes(c.continent_en ?? ""))
      .filter((c) => currencyFilter.length === 0 || currencyFilter.includes(c.currency ?? ""))
      .sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        return av.localeCompare(bv) * dir;
      });
  }, [countries, search, continentFilter, currencyFilter, sortKey, sortDir]);

  return (
    <div>
      <input
        placeholder="Search countries..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 mb-3 focus:outline-none focus:ring-2 focus:ring-slate-300"
      />
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="ISO2" options={[]} selected={[]} onChange={() => {}} sortDir={sortKey === "iso2" ? sortDir : null} onSort={(dir) => handleSort("iso2", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Country" options={[]} selected={[]} onChange={() => {}} sortDir={sortKey === "country_en" ? sortDir : null} onSort={(dir) => handleSort("country_en", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Continent" options={continents} selected={continentFilter} onChange={setContinentFilter} sortDir={sortKey === "continent_en" ? sortDir : null} onSort={(dir) => handleSort("continent_en", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Languages" options={[]} selected={[]} onChange={() => {}} sortDir={sortKey === "languages_en" ? sortDir : null} onSort={(dir) => handleSort("languages_en", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Capital" options={[]} selected={[]} onChange={() => {}} sortDir={sortKey === "capital" ? sortDir : null} onSort={(dir) => handleSort("capital", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Currency" options={currencies} selected={currencyFilter} onChange={setCurrencyFilter} sortDir={sortKey === "currency" ? sortDir : null} onSort={(dir) => handleSort("currency", dir)} />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.iso2} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => onSelect(c.iso2)}>
                <td className="px-3 py-2 font-mono text-xs text-slate-500">{c.iso2}</td>
                <td className="px-3 py-2 font-medium text-slate-700 hover:underline">{c.country_en}</td>
                <td className="px-3 py-2 text-slate-600">{c.continent_en ?? "—"}</td>
                <td className="px-3 py-2 text-slate-500 max-w-[220px] truncate" title={c.languages_en ?? undefined}>
                  {c.languages_en ?? "—"}
                </td>
                <td className="px-3 py-2 text-slate-600">{c.capital ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600">{c.currency ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
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
