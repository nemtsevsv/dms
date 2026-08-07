"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { activityStatusBadge, ACTIVITY_STATUSES } from "@/lib/marketingStatusColors";
import ColumnFilterHeader from "./ColumnFilterHeader";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { buildCanonicalMap, canonicalValue } from "@/lib/normalizeText";
import { exportToXlsx } from "@/lib/exportXlsx";
import { btnPrimary, btnExport } from "@/lib/buttonStyles";
import { Download } from "lucide-react";
import { format } from "date-fns";

type Activity = {
  id: string;
  name: string;
  activity_type: string | null;
  status: string;
  start_date: string;
  end_date: string;
  country: string | null;
  store_name: string | null;
  dealer_name: string | null;
  budget_planned: number | null;
  currency: string;
};

function applyFilter(value: string, selected: string[]) {
  return selected.length === 0 || (selected.length === 1 && selected[0] === "__none__" ? false : selected.includes(value));
}

type SortKey = "name" | "activity_type" | "status" | "country" | "start_date" | "budget_planned";

export default function MarketingActivityTable({ activities }: { activities: Activity[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("start_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const countryMap = useMemo(() => buildCanonicalMap(activities.map((a) => a.country)), [activities]);
  const countries = Array.from(new Set(countryMap.values())).sort();
  const types = Array.from(new Set(activities.map((a) => a.activity_type).filter(Boolean))) as string[];
  const statuses = ACTIVITY_STATUSES.map((s) => s.name).filter((s) => activities.some((a) => a.status === s));

  function handleSort(key: SortKey, dir: "asc" | "desc") {
    setSortKey(key);
    setSortDir(dir);
  }

  const filtered = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return activities
      .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
      .filter((a) => applyFilter(a.activity_type ?? "", typeFilter))
      .filter((a) => applyFilter(a.status, statusFilter))
      .filter((a) => applyFilter(canonicalValue(a.country, countryMap), countryFilter))
      .sort((a, b) => {
        if (sortKey === "budget_planned") return ((a.budget_planned ?? 0) - (b.budget_planned ?? 0)) * dir;
        if (sortKey === "status") return a.status.localeCompare(b.status) * dir;
        if (sortKey === "activity_type") return (a.activity_type ?? "").localeCompare(b.activity_type ?? "") * dir;
        if (sortKey === "country") return canonicalValue(a.country, countryMap).localeCompare(canonicalValue(b.country, countryMap)) * dir;
        if (sortKey === "start_date") return (new Date(a.start_date).getTime() - new Date(b.start_date).getTime()) * dir;
        return a.name.localeCompare(b.name) * dir;
      });
  }, [activities, search, typeFilter, statusFilter, countryFilter, countryMap, sortKey, sortDir]);

  function handleExport() {
    const header = ["Name", "Type", "Status", "Country", "Store", "Dealer", "Start", "End", "Budget Planned"];
    const rows = filtered.map((a) => [
      a.name,
      a.activity_type ?? "",
      a.status,
      a.country ?? "",
      a.store_name ?? "",
      a.dealer_name ?? "",
      format(new Date(a.start_date), "dd.MM.yyyy"),
      format(new Date(a.end_date), "dd.MM.yyyy"),
      `${a.budget_planned ?? 0} ${a.currency}`,
    ]);
    exportToXlsx("marketing-activities.xlsx", header, rows, "Activities");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          placeholder="Search by activity name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <MultiSelectDropdown label="Type" options={types} selected={typeFilter} onChange={setTypeFilter} />
        <button onClick={handleExport} className={btnExport + " sm:ml-auto"}>
          <Download size={14} />
          Export to Excel
        </button>
        <Link href="/marketing-activities/new" className={btnPrimary}>
          + New Activity
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Name" options={[]} selected={[]} onChange={() => {}} sortDir={sortKey === "name" ? sortDir : null} onSort={(dir) => handleSort("name", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Type" options={types} selected={typeFilter} onChange={setTypeFilter} sortDir={sortKey === "activity_type" ? sortDir : null} onSort={(dir) => handleSort("activity_type", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Status" options={statuses} selected={statusFilter} onChange={setStatusFilter} sortDir={sortKey === "status" ? sortDir : null} onSort={(dir) => handleSort("status", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Country" options={countries} selected={countryFilter} onChange={setCountryFilter} sortDir={sortKey === "country" ? sortDir : null} onSort={(dir) => handleSort("country", dir)} />
              </th>
              <th className="text-left px-3 py-2.5">Scope</th>
              <th className="text-left px-3 py-2.5">
                <ColumnFilterHeader label="Dates" options={[]} selected={[]} onChange={() => {}} sortDir={sortKey === "start_date" ? sortDir : null} onSort={(dir) => handleSort("start_date", dir)} />
              </th>
              <th className="text-right px-3 py-2.5">
                <ColumnFilterHeader label="Budget" options={[]} selected={[]} onChange={() => {}} align="right" sortDir={sortKey === "budget_planned" ? sortDir : null} onSort={(dir) => handleSort("budget_planned", dir)} />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  <Link href={`/marketing-activities/${a.id}`} className="font-medium hover:underline">
                    {a.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{a.activity_type ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${activityStatusBadge(a.status)}`}>{a.status}</span>
                </td>
                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{a.country ?? "—"}</td>
                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{a.store_name ?? a.dealer_name ?? (a.country ? "Country-wide" : "Company-wide")}</td>
                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                  {format(new Date(a.start_date), "dd.MM.yyyy")} – {format(new Date(a.end_date), "dd.MM.yyyy")}
                </td>
                <td className="px-3 py-2 text-right text-slate-700 whitespace-nowrap">
                  {(a.budget_planned ?? 0).toLocaleString("de-DE")} {a.currency}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No activities found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
