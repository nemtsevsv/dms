"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

// Runs sequentially in the browser, one country at a time — not a server
// job. This sidesteps serverless execution time limits entirely (each
// individual call is short) and gives visible progress instead of a
// black-box background process.
export default function CountryDashboardBulkRefresh({ countries }: { countries: { iso2: string }[] }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(0);

  async function runAll() {
    setRunning(true);
    setDone(0);
    setFailed(0);
    for (const c of countries) {
      try {
        const res = await fetch("/api/country-dashboard/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ iso2: c.iso2 }),
        });
        if (res.ok) setDone((d) => d + 1);
        else setFailed((f) => f + 1);
      } catch {
        setFailed((f) => f + 1);
      }
    }
    setRunning(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={runAll}
        disabled={running}
        className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50"
      >
        <RefreshCw size={14} className={running ? "animate-spin" : ""} />
        {running ? `Refreshing... ${done + failed}/${countries.length}` : "Refresh all countries"}
      </button>
      {!running && (done > 0 || failed > 0) && (
        <span className="text-xs text-slate-500">
          Done: {done} · Failed: {failed}
        </span>
      )}
    </div>
  );
}
