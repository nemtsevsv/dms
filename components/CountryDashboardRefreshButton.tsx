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
            <div className="space-y-2">
              {(["worldBank", "geonames", "eurostat"] as const).map((src) => {
                const s = result.summary[src];
                const labels: Record<string, string> = { worldBank: "World Bank", geonames: "GeoNames", eurostat: "Eurostat (experimental)" };
                return (
                  <div key={src}>
                    <p>
                      {labels[src]}: {s.ok} ok, {s.failed} failed
                    </p>
                    {s.errors?.length > 0 && (
                      <ul className="mt-0.5 pl-3 list-disc text-red-600">
                        {s.errors.slice(0, 6).map((e: string, i: number) => (
                          <li key={i}>{e}</li>
                        ))}
                        {s.errors.length > 6 && <li>...and {s.errors.length - 6} more</li>}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
