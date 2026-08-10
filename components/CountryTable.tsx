"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { btnPrimary } from "@/lib/buttonStyles";
import ColumnFilterHeader from "./ColumnFilterHeader";

type Country = {
  id: string;
  name: string;
  capital: string | null;
  biggest_cities: string | null;
  population: number | null;
  gdp: number | null;
  gdp_ppp: number | null;
  hnwi: number | null;
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

function fmtMio(n: number | null) {
  if (n === null || n === undefined) return "—";
  return (n / 1_000_000).toLocaleString("de-DE", { maximumFractionDigits: 0 });
}

type SortKey = "name" | "capital" | "population" | "gdp" | "gdp_per_capita" | "gdp_ppp" | "gdp_ppp_per_capita" | "hnwi" | "vat";

type DealerCounts = { active: number; potential: number };

export default function CountryTable({ countries, dealerCounts }: { countries: Country[]; dealerCounts: Record<string, DealerCounts> }) {
  const [search, setSearch] = useState("");
  const [capitalFilter, setCapitalFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const capitals = Array.from(new Set(countries.map((c) => c.capital).filter(Boolean))) as string[];

  function handleSort(key: SortKey, dir: "asc" | "desc") {
    setSortKey(key);
    setSortDir(dir);
  }

  const rows = useMemo(
    () =>
      countries.map((c) => ({
        ...c,
        gdpPerCapita: perCapita(c.gdp, c.population),
        gdpPppPerCapita: perCapita(c.gdp_ppp, c.population),
      })),
    [countries]
  );

  const filtered = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return rows
      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => capitalFilter.length === 0 || capitalFilter.includes(c.capital ?? ""))
      .sort((a, b) => {
        if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
        if (sortKey === "capital") return (a.capital ?? "").localeCompare(b.capital ?? "") * dir;
        if (sortKey === "population") return ((a.population ?? 0) - (b.population ?? 0)) * dir;
        if (sortKey === "gdp") return ((a.gdp ?? 0) - (b.gdp ?? 0)) * dir;
        if (sortKey === "gdp_per_capita") return ((a.gdpPerCapita ?? 0) - (b.gdpPerCapita ?? 0)) * dir;
        if (sortKey === "gdp_ppp") return ((a.gdp_ppp ?? 0) - (b.gdp_ppp ?? 0)) * dir;
        if (sortKey === "gdp_ppp_per_capita") return ((a.gdpPppPerCapita ?? 0) - (b.gdpPppPerCapita ?? 0)) * dir;
        if (sortKey === "hnwi") return ((a.hnwi ?? 0) - (b.hnwi ?? 0)) * dir;
        if (sortKey === "vat") return ((a.vat ?? 0) - (b.vat ?? 0)) * dir;
        return 0;
      });
  }, [rows, search, capitalFilter, sortKey, sortDir]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
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
      <p className="text-[11px] text-slate-400 mb-2">GDP and GDP PPP shown in million USD.</p>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase">
            <tr>
              <th className="text-left px-2 py-2">
                <ColumnFilterHeader label="Country" options={[]} selected={[]} onChange={() => {}} sortDir={sortKey === "name" ? sortDir : null} onSort={(dir) => handleSort("name", dir)} />
              </th>
              <th className="text-center px-2 py-2 bg-amber-50">Dealers (active/potential)</th>
              <th className="text-left px-2 py-2">
                <ColumnFilterHeader label="Capital" options={capitals} selected={capitalFilter} onChange={setCapitalFilter} sortDir={sortKey === "capital" ? sortDir : null} onSort={(dir) => handleSort("capital", dir)} />
              </th>
              <th className="text-left px-2 py-2">Cities</th>
              <th className="text-right px-2 py-2">
                <ColumnFilterHeader label="Population" options={[]} selected={[]} onChange={() => {}} align="right" sortDir={sortKey === "population" ? sortDir : null} onSort={(dir) => handleSort("population", dir)} />
              </th>
              <th className="text-right px-2 py-2">
                <ColumnFilterHeader label="GDP" options={[]} selected={[]} onChange={() => {}} align="right" sortDir={sortKey === "gdp" ? sortDir : null} onSort={(dir) => handleSort("gdp", dir)} />
              </th>
              <th className="text-right px-2 py-2">
                <ColumnFilterHeader label="GDP/cap" options={[]} selected={[]} onChange={() => {}} align="right" sortDir={sortKey === "gdp_per_capita" ? sortDir : null} onSort={(dir) => handleSort("gdp_per_capita", dir)} />
              </th>
              <th className="text-right px-2 py-2">
                <ColumnFilterHeader label="GDP PPP" options={[]} selected={[]} onChange={() => {}} align="right" sortDir={sortKey === "gdp_ppp" ? sortDir : null} onSort={(dir) => handleSort("gdp_ppp", dir)} />
              </th>
              <th className="text-right px-2 py-2">
                <ColumnFilterHeader label="PPP/cap" options={[]} selected={[]} onChange={() => {}} align="right" sortDir={sortKey === "gdp_ppp_per_capita" ? sortDir : null} onSort={(dir) => handleSort("gdp_ppp_per_capita", dir)} />
              </th>
              <th className="text-right px-2 py-2">
                <ColumnFilterHeader label="HNWI" options={[]} selected={[]} onChange={() => {}} align="right" sortDir={sortKey === "hnwi" ? sortDir : null} onSort={(dir) => handleSort("hnwi", dir)} />
              </th>
              <th className="text-right px-2 py-2">
                <ColumnFilterHeader label="VAT" options={[]} selected={[]} onChange={() => {}} align="right" sortDir={sortKey === "vat" ? sortDir : null} onSort={(dir) => handleSort("vat", dir)} />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <Link href={`/countries/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-2 py-1.5 text-center whitespace-nowrap bg-amber-50 font-medium text-slate-700">
                  {dealerCounts[c.name]?.active ?? 0} / {dealerCounts[c.name]?.potential ?? 0}
                </td>
                <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">{c.capital ?? "—"}</td>
                <td className="px-2 py-1.5 text-slate-500 max-w-[100px] truncate" title={c.biggest_cities ?? undefined}>
                  {c.biggest_cities ?? "—"}
                </td>
                <td className="px-2 py-1.5 text-right text-slate-600 whitespace-nowrap">{fmt(c.population)}</td>
                <td className="px-2 py-1.5 text-right text-slate-700 whitespace-nowrap">{fmtMio(c.gdp)}</td>
                <td className="px-2 py-1.5 text-right text-slate-500 whitespace-nowrap">{fmt(c.gdpPerCapita)}</td>
                <td className="px-2 py-1.5 text-right text-slate-700 whitespace-nowrap">{fmtMio(c.gdp_ppp)}</td>
                <td className="px-2 py-1.5 text-right text-slate-500 whitespace-nowrap">{fmt(c.gdpPppPerCapita)}</td>
                <td className="px-2 py-1.5 text-right text-slate-600 whitespace-nowrap">{fmt(c.hnwi)}</td>
                <td className="px-2 py-1.5 text-right text-slate-600 whitespace-nowrap">{c.vat !== null ? `${c.vat}%` : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-8 text-slate-400">
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
