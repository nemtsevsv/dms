"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Minus } from "lucide-react";

type Slot = { startHour: number; label: string };

// Shared with CustomerActivities so the New / Existing columns line up
// visually between the two cards.
const GRID = "grid grid-cols-[52px_1fr_1fr] items-center gap-2";

export default function VisitorTrafficSlots({
  storeId,
  reportDate,
  slots,
  slotCounts,
  onChange,
}: {
  storeId: string;
  reportDate: string;
  slots: Slot[];
  slotCounts: Record<string, number>; // key = `${startHour}-new` / `${startHour}-existing`
  onChange?: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [pending, setPending] = useState<string | null>(null);

  const totalNew = slots.reduce((s, sl) => s + (slotCounts[`${sl.startHour}-new`] ?? 0), 0);
  const totalExisting = slots.reduce((s, sl) => s + (slotCounts[`${sl.startHour}-existing`] ?? 0), 0);

  function refresh() {
    router.refresh();
    onChange?.();
  }

  async function tap(startHour: number, customerType: "new" | "existing") {
    const key = `${startHour}-${customerType}`;
    setPending(key);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // "Z" pins this as UTC on write, matching the UTC read-back used to
    // bucket events into slots — without it, the server's default session
    // timezone could shift the hour and the tap would silently miss its slot.
    const occurredAt = `${reportDate}T${String(startHour).padStart(2, "0")}:30:00Z`;
    await supabase.from("store_traffic_events").insert({
      store_id: storeId,
      event_type: "visitor",
      customer_type: customerType,
      occurred_at: occurredAt,
      created_by: user?.email ?? null,
    });
    setPending(null);
    refresh();
  }

  async function undo(startHour: number, customerType: "new" | "existing") {
    const key = `${startHour}-${customerType}`;
    if ((slotCounts[key] ?? 0) <= 0) return;
    setPending(`undo-${key}`);
    const dayStart = `${reportDate}T00:00:00Z`;
    const dayEnd = `${reportDate}T23:59:59Z`;
    const { data: recent } = await supabase
      .from("store_traffic_events")
      .select("id, occurred_at")
      .eq("store_id", storeId)
      .eq("event_type", "visitor")
      .eq("customer_type", customerType)
      .gte("occurred_at", dayStart)
      .lte("occurred_at", dayEnd)
      .order("occurred_at", { ascending: false });
    const match = (recent ?? []).find((r) => new Date(r.occurred_at).getUTCHours() === startHour);
    if (match) {
      await supabase.from("store_traffic_events").delete().eq("id", match.id);
    }
    setPending(null);
    refresh();
  }

  function Stepper({ startHour, ct }: { startHour: number; ct: "new" | "existing" }) {
    const key = `${startHour}-${ct}`;
    const count = slotCounts[key] ?? 0;
    return (
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => undo(startHour, ct)}
          disabled={pending === `undo-${key}` || count === 0}
          aria-label={`-1 ${ct} for ${startHour}:00`}
          className="w-10 h-10 md:w-7 md:h-7 shrink-0 flex items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 active:bg-red-100 disabled:opacity-30"
        >
          <Minus size={16} className="md:hidden" />
          <Minus size={12} className="hidden md:block" />
        </button>
        <span className="w-5 text-center text-base md:text-sm font-semibold tabular-nums">{count}</span>
        <button
          onClick={() => tap(startHour, ct)}
          disabled={pending === key}
          aria-label={`+1 ${ct} for ${startHour}:00`}
          className="w-10 h-10 md:w-7 md:h-7 shrink-0 flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 active:bg-emerald-100 disabled:opacity-50"
        >
          <Plus size={16} className="md:hidden" />
          <Plus size={12} className="hidden md:block" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium">Visitor traffic</h2>
        <span className="text-sm text-slate-500">
          Total: <span className="font-semibold text-slate-800">{totalNew + totalExisting}</span>
        </span>
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-slate-400">No opening hours set for today — set the schedule first.</p>
      ) : (
        <div>
          <div className={`${GRID} text-xs text-slate-400 mb-1`}>
            <span></span>
            <span className="text-center">New</span>
            <span className="text-center">Existing</span>
          </div>
          <div className="space-y-1">
            {slots.map((slot) => (
              <div key={slot.startHour} className={`${GRID} py-1 border-t border-slate-50`}>
                <span className="text-xs text-slate-400">{slot.label}</span>
                <Stepper startHour={slot.startHour} ct="new" />
                <Stepper startHour={slot.startHour} ct="existing" />
              </div>
            ))}
            <div className={`${GRID} pt-2 border-t border-slate-200 font-medium`}>
              <span className="text-xs text-slate-500">Total</span>
              <span className="text-center">{totalNew}</span>
              <span className="text-center">{totalExisting}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
