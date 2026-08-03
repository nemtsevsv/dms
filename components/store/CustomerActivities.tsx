"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Minus } from "lucide-react";

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
  onChange,
}: {
  storeId: string;
  reportDate: string;
  counts: Record<string, number>; // key = `${type}-${customerType}`
  onChange?: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [pending, setPending] = useState<string | null>(null);

  function refresh() {
    router.refresh();
    onChange?.();
  }

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
    refresh();
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
    refresh();
  }

  function Cell({ type, ct }: { type: EventType; ct: CustomerType }) {
    const key = `${type}-${ct}`;
    const count = counts[key] ?? 0;
    return (
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => undo(type, ct)}
          disabled={pending === `undo-${key}` || count === 0}
          aria-label={`-1 ${ct} ${type}`}
          className="w-6 h-6 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-30"
        >
          <Minus size={11} />
        </button>
        <span className="w-5 text-center text-sm font-medium tabular-nums">{count}</span>
        <button
          onClick={() => tap(type, ct)}
          disabled={pending === key}
          aria-label={`+1 ${ct} ${type}`}
          className="w-6 h-6 flex items-center justify-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
        >
          <Plus size={11} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <h2 className="font-medium mb-3">Customer activities</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-400">
            <th className="text-left font-normal pb-1"></th>
            <th className="font-normal pb-1">New</th>
            <th className="font-normal pb-1">Existing</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.type} className="border-t border-slate-50">
              <td className="py-1.5 text-xs text-slate-500">{row.label}</td>
              <td className="py-1.5">
                <Cell type={row.type} ct="new" />
              </td>
              <td className="py-1.5">
                <Cell type={row.type} ct="existing" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
