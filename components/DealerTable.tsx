"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { dealerStatusBadge, DEALER_STATUSES } from "@/lib/statusColors";
import { achievementColorClass } from "@/lib/achievementColor";
import MultiSelectDropdown from "./MultiSelectDropdown";
import ColumnFilterHeader from "./ColumnFilterHeader";
import { buildCanonicalMap, canonicalValue } from "@/lib/normalizeText";
import { exportToXlsx } from "@/lib/exportXlsx";
import { btnPrimary, btnExport } from "@/lib/buttonStyles";
import { Download } from "lucide-react";

type Dealer = {
  id: string;
  status: string;
  company_name: string;
  country: string | null;
  city: string | null;
  annual_sales_plan: number | null;
  actual_sales: number;
  manager_name: string;
  product_categories: string[];
};

function applyFilter(value: string, selected: string[]) {
  return selected.length === 0 || (selected.length === 1 && selected[0] === "__none__" ? false : selected.includes(value));
}

type SortKey = "company_name" | "status" | "manager" | "annual_sales_plan" | "actual_sales" | "achievement";

export default function DealerTable({ dealers }: { dealers: Dealer[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [managerFilter, setManagerFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("company_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const countryMap = useMemo(() => buildCanonicalMap(dealers.map((d) => d.country)), [dealers]);
  const countries = Array.from(new Set(countryMap.values())).sort();
  const statuses = DEALER_STATUSES.map((s) => s.name).filter((s) => dealers.some((d) => d.status === s));
  const managers = Array.from(new Set(dealers.map((d) => d.manager_name).filter((m) => m && m !== "—")));
  const categories = Array.from(new Set(dealers.flatMap((d) => d.product_categories)));

  function achievementPct(d: Dealer) {
    return d.annual_sales_plan ? Math.round((d.actual_sales / d.annual_sales_plan) * 100) : 0;
  }

  function handleSort(key: SortKey, dir: "asc" | "desc") {
    setSortKey(key);
    setSortDir(dir);
  }

  const filtered = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return dealers
      .filter((d) => d.company_name.toLowerCase().includes(search.toLowerCase()))
      .filter((d) => applyFilter(d.status, statusFilter))
      .filter((d) => applyFilter(canonicalValue(d.country, countryMap), countryFilter))
      .filter((d) => applyFilter(d.manager_name, managerFilter))
      .filter((d) => categoryFilter.length === 0 || d.product_categories.some((c) => categoryFilter.includes(c)))
      .sort((a, b) => {
        if (sortKey === "annual_sales_plan") return ((a.annual_sales_plan ?? 0) - (b.annual_sales_plan ?? 0)) * dir;
        if (sortKey === "actual_sales") return ((a.actual_sales ?? 0) - (b.actual_sales ?? 0)) * dir;
        if (sortKey === "achievement") return (achievementPct(a) - achievementPct(b)) * dir;
        if (sortKey === "status") return a.status.localeCompare(b.status) * dir;
        if (sortKey === "manager") return a.manager_name.localeCompare(b.manager_name) * dir;
        return a.company_name.localeCompare(b.company_name) * dir;
      });
  }, [dealers, search, statusFilter, countryFilter, managerFilter, categoryFilter, sortKey, sortDir]);

  function exportXlsx() {
    const header = ["Company", "Status", "Country", "City", "Manager", "Annual Plan (EUR)", "Actual Sales (EUR)", "Target Achievement (%)"];
    const rows = filtered.map((d) => [
      d.company_name,
      d.status,
      d.country ?? "",
      d.city ?? "",
      d.manager_name,
      d.annual_sales_plan ?? 0,
      d.actual_sales ?? 0,
      achievementPct(d),
    ]);
    exportToXlsx("dealers.xlsx", header, rows, "Dealers");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          placeholder="Search by company name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <MultiSelectDropdown label="Categories" options={categories} selected={categoryFilter} onChange={setCategoryFilter} />
        <button onClick={exportXlsx} className={btnExport + " sm:ml-auto"}>
          <Download size={14} />
          Export to Excel
        </button>
        <Link href="/dealers/new" className={btnPrimary}>
          + New Dealer
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader
                  label="Company"
                  options={[]}
                  selected={[]}
                  onChange={() => {}}
                  sortDir={sortKey === "company_name" ? sortDir : null}
                  onSort={(dir) => handleSort("company_name", dir)}
                />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader
                  label="Status"
                  options={statuses}
                  selected={statusFilter}
                  onChange={setStatusFilter}
                  sortDir={sortKey === "status" ? sortDir : null}
                  onSort={(dir) => handleSort("status", dir)}
                />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Country" options={countries} selected={countryFilter} onChange={setCountryFilter} />
              </th>
              <th className="text-left px-3 py-2.5">City</th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader
                  label="Manager"
                  options={managers}
                  selected={managerFilter}
                  onChange={setManagerFilter}
                  sortDir={sortKey === "manager" ? sortDir : null}
                  onSort={(dir) => handleSort("manager", dir)}
                />
              </th>
              <th className="text-right px-3 py-2.5">
                <ColumnFilterHeader
                  label="Plan"
                  options={[]}
                  selected={[]}
                  onChange={() => {}}
                  align="right"
                  sortDir={sortKey === "annual_sales_plan" ? sortDir : null}
                  onSort={(dir) => handleSort("annual_sales_plan", dir)}
                />
              </th>
              <th className="text-right px-3 py-2.5">
                <ColumnFilterHeader
                  label="Actual Sales"
                  options={[]}
                  selected={[]}
                  onChange={() => {}}
                  align="right"
                  sortDir={sortKey === "actual_sales" ? sortDir : null}
                  onSort={(dir) => handleSort("actual_sales", dir)}
                />
              </th>
              <th className="text-right px-3 py-2.5">
                <ColumnFilterHeader
                  label="Achievement"
                  options={[]}
                  selected={[]}
                  onChange={() => {}}
                  align="right"
                  sortDir={sortKey === "achievement" ? sortDir : null}
                  onSort={(dir) => handleSort("achievement", dir)}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  <Link href={`/dealers/${d.id}`} className="font-medium hover:underline">
                    {d.company_name}
                  </Link>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${dealerStatusBadge(d.status)}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{d.country}</td>
                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{d.city}</td>
                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{d.manager_name}</td>
                <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">{(d.annual_sales_plan ?? 0).toLocaleString("de-DE")}</td>
                <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">{(d.actual_sales ?? 0).toLocaleString("de-DE")}</td>
                <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${achievementColorClass(achievementPct(d))}`}>
                  {achievementPct(d)}%
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400">
                  No dealers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
