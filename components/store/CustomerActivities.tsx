"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Minus } from "lucide-react";

type EventType = "call" | "test_drive";
type CustomerType = "new" | "existing";

const ROWS: { type: EventType; label: string }[] = [
  { type: "call", label: "Calls / Messages" },
  { type: "test_drive", label: "Test-Drives" },
];

// Same grid template as VisitorTrafficSlots so New / Existing line up
// vertically between the two cards.
const GRID = "grid grid-cols-[52px_1fr_1fr] items-center gap-2";
const REFRESH_DEBOUNCE_MS = 900;

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
  const [localDelta, setLocalDelta] = useState<Record<string, number>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalDelta({});
  }, [counts]);

  function count(key: string) {
    return (counts[key] ?? 0) + (localDelta[key] ?? 0);
  }

  function scheduleRefresh() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.refresh();
      onChange?.();
    }, REFRESH_DEBOUNCE_MS);
  }

  async function tap(type: EventType, customerType: CustomerType) {
    const key = `${type}-${customerType}`;
    setLocalDelta((d) => ({ ...d, [key]: (d[key] ?? 0) + 1 }));
    scheduleRefresh();
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
  }

  async function undo(type: EventType, customerType: CustomerType) {
    const key = `${type}-${customerType}`;
    if (count(key) <= 0) return;
    setLocalDelta((d) => ({ ...d, [key]: (d[key] ?? 0) - 1 }));
    scheduleRefresh();
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
  }

  function Stepper({ type, ct }: { type: EventType; ct: CustomerType }) {
    const key = `${type}-${ct}`;
    return (
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => undo(type, ct)}
          disabled={count(key) === 0}
          aria-label={`-1 ${ct} ${type}`}
          className="w-10 h-10 md:w-7 md:h-7 shrink-0 flex items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 active:bg-red-100 disabled:opacity-30"
        >
          <Minus size={16} className="md:hidden" />
          <Minus size={12} className="hidden md:block" />
        </button>
        <span className="w-5 text-center text-base md:text-sm font-semibold tabular-nums">{count(key)}</span>
        <button
          onClick={() => tap(type, ct)}
          aria-label={`+1 ${ct} ${type}`}
          className="w-10 h-10 md:w-7 md:h-7 shrink-0 flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 active:bg-emerald-100"
        >
          <Plus size={16} className="md:hidden" />
          <Plus size={12} className="hidden md:block" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <h2 className="font-medium mb-3">Customer activities</h2>
      <div className={`${GRID} text-xs text-slate-400 mb-1`}>
        <span></span>
        <span className="text-center">New</span>
        <span className="text-center">Existing</span>
      </div>
      <div className="space-y-1">
        {ROWS.map((row) => (
          <div key={row.type} className={`${GRID} py-1.5 border-t border-slate-50`}>
            <span className="text-xs text-slate-500 leading-tight">{row.label}</span>
            <Stepper type={row.type} ct="new" />
            <Stepper type={row.type} ct="existing" />
          </div>
        ))}
      </div>
    </div>
  );
}
