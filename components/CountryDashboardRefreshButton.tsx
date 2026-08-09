"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function CountryDashboardRefreshButton({ iso2 }: { iso2: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleRefresh() {
    setLoading(true);
    setResult(null);
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
      setResult(json);
      router.refresh();
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        {loading ? "Refreshing..." : "Refresh"}
      </button>
      {result && (
        <div className="mt-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2 max-w-md">
          {result.error && <p className="text-red-600">{result.error}</p>}
          {result.summary && (
            <>
              <p>World Bank: {result.summary.worldBank.ok} ok, {result.summary.worldBank.failed} failed</p>
              <p>GeoNames: {result.summary.geonames.ok} ok, {result.summary.geonames.failed} failed</p>
              <p>Eurostat (experimental): {result.summary.eurostat.ok} ok, {result.summary.eurostat.failed} failed</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
