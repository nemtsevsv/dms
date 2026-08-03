"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Minus } from "lucide-react";

type EventType = "call" | "test_drive";
type CustomerType = "new" | "existing";

const ROWS: { type: EventType; label: string }[] = [
  { type: "call", label: "Calls / Messages" },
  { type: "test_drive", label: "Test-Drives" },
];

export default function CustomerActivities({
  storeId,
  reportDate,
  counts,
}: {
  storeId: string;
  reportDate: string;
  counts: Record<string, number>; // key = `${type}-${customerType}`
}) {
  const router = useRouter();
  const supabase = createClient();
  const [pending, setPending] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

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
      occurred_at: `${reportDate}T12:00:00Z`,
      created_by: user?.email ?? null,
    });
    setPending(null);
    setFlash(key);
    setTimeout(() => setFlash(null), 500);
    router.refresh();
  }

  async function undo(type: EventType, customerType: CustomerType) {
    const key = `${type}-${customerType}`;
    if ((counts[key] ?? 0) <= 0) return;
    setPending(`undo-${key}`);
    const { data: recent } = await supabase
      .from("store_traffic_events")
      .select("id")
      .eq("store_id", storeId)
      .eq("event_type", type)
      .eq("customer_type", customerType)
      .gte("occurred_at", `${reportDate}T00:00:00Z`)
      .lte("occurred_at", `${reportDate}T23:59:59Z`)
      .order("occurred_at", { ascending: false })
      .limit(1);
    if (recent && recent.length > 0) {
      await supabase.from("store_traffic_events").delete().eq("id", recent[0].id);
    }
    setPending(null);
    router.refresh();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <h2 className="font-medium mb-4">Customer activities</h2>
      <div className="space-y-3">
        {ROWS.map((row) => (
          <div key={row.type}>
            <div className="text-xs text-slate-500 mb-1">{row.label}</div>
            <div className="grid grid-cols-2 gap-2">
              {(["new", "existing"] as CustomerType[]).map((ct) => {
                const key = `${row.type}-${ct}`;
                const count = counts[key] ?? 0;
                const isFlashing = flash === key;
                return (
                  <div key={ct} className="flex items-stretch gap-1">
                    <button
                      onClick={() => tap(row.type, ct)}
                      disabled={pending === key}
                      className={`flex-1 flex items-center justify-between px-4 py-3 md:py-2 rounded-xl border transition-colors disabled:opacity-50 ${
                        isFlashing ? "bg-emerald-100 border-emerald-400" : "border-slate-300 hover:bg-slate-50 active:bg-slate-100"
                      }`}
                    >
                      <span className="text-sm capitalize">+1 {ct}</span>
                      <span className="text-lg font-semibold">{count}</span>
                    </button>
                    <button
                      onClick={() => undo(row.type, ct)}
                      disabled={pending === `undo-${key}` || count === 0}
                      aria-label={`Remove one ${ct} ${row.label}`}
                      className="w-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
