"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Slot = { startHour: number; label: string };

export default function VisitorTrafficSlots({
  storeId,
  reportDate,
  slots,
  slotCounts,
}: {
  storeId: string;
  reportDate: string;
  slots: Slot[];
  slotCounts: Record<string, number>; // key = `${startHour}-new` / `${startHour}-existing`
}) {
  const router = useRouter();
  const supabase = createClient();
  const [pending, setPending] = useState<string | null>(null);

  const totalNew = slots.reduce((s, sl) => s + (slotCounts[`${sl.startHour}-new`] ?? 0), 0);
  const totalExisting = slots.reduce((s, sl) => s + (slotCounts[`${sl.startHour}-existing`] ?? 0), 0);

  async function tap(startHour: number, customerType: "new" | "existing") {
    const key = `${startHour}-${customerType}`;
    setPending(key);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const occurredAt = `${reportDate}T${String(startHour).padStart(2, "0")}:30:00`;
    await supabase.from("store_traffic_events").insert({
      store_id: storeId,
      event_type: "visitor",
      customer_type: customerType,
      occurred_at: occurredAt,
      created_by: user?.email ?? null,
    });
    setPending(null);
    router.refresh();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">Visitor traffic</h2>
        <span className="text-sm text-slate-500">
          Total: <span className="font-semibold text-slate-800">{totalNew + totalExisting}</span> ({totalNew} new · {totalExisting} existing)
        </span>
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-slate-400">No opening hours set for today — set the schedule first.</p>
      ) : (
        <div className="space-y-2">
          {slots.map((slot) => {
            const newCount = slotCounts[`${slot.startHour}-new`] ?? 0;
            const existingCount = slotCounts[`${slot.startHour}-existing`] ?? 0;
            return (
              <div key={slot.startHour} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-16 shrink-0">{slot.label}</span>
                <button
                  onClick={() => tap(slot.startHour, "new")}
                  disabled={pending === `${slot.startHour}-new`}
                  className="flex-1 flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50"
                >
                  <span className="text-xs">+1 New</span>
                  <span className="text-base font-semibold">{newCount}</span>
                </button>
                <button
                  onClick={() => tap(slot.startHour, "existing")}
                  disabled={pending === `${slot.startHour}-existing`}
                  className="flex-1 flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50"
                >
                  <span className="text-xs">+1 Existing</span>
                  <span className="text-base font-semibold">{existingCount}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
