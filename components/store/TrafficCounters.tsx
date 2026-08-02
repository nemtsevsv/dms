"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type EventType = "visitor" | "call" | "test_drive";
type CustomerType = "new" | "existing";

const ROWS: { type: EventType; label: string }[] = [
  { type: "visitor", label: "Visitors" },
  { type: "call", label: "Calls / Messages" },
  { type: "test_drive", label: "Test-Drives" },
];

export default function TrafficCounters({
  storeId,
  counts,
}: {
  storeId: string;
  counts: Record<string, number>; // key = `${type}-${customerType}`
}) {
  const router = useRouter();
  const supabase = createClient();
  const [pending, setPending] = useState<string | null>(null);

  async function tap(type: EventType, customerType: CustomerType) {
    const key = `${type}-${customerType}`;
    setPending(key);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("store_traffic_events").insert({
      store_id: storeId,
      event_type: type,
      customer_type: customerType,
      created_by: user?.email ?? null,
    });
    setPending(null);
    router.refresh();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <h2 className="font-medium mb-4">Traffic today</h2>
      <div className="space-y-3">
        {ROWS.map((row) => (
          <div key={row.type}>
            <div className="text-xs text-slate-500 mb-1">{row.label}</div>
            <div className="grid grid-cols-2 gap-2">
              {(["new", "existing"] as CustomerType[]).map((ct) => {
                const key = `${row.type}-${ct}`;
                return (
                  <button
                    key={ct}
                    onClick={() => tap(row.type, ct)}
                    disabled={pending === key}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50"
                  >
                    <span className="text-sm capitalize">+1 {ct}</span>
                    <span className="text-lg font-semibold">{counts[key] ?? 0}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
