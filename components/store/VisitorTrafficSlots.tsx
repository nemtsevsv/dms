"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Minus } from "lucide-react";

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
  const [flash, setFlash] = useState<string | null>(null);

  const totalNew = slots.reduce((s, sl) => s + (slotCounts[`${sl.startHour}-new`] ?? 0), 0);
  const totalExisting = slots.reduce((s, sl) => s + (slotCounts[`${sl.startHour}-existing`] ?? 0), 0);

  function flashKey(key: string) {
    setFlash(key);
    setTimeout(() => setFlash(null), 500);
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
    flashKey(key);
    router.refresh();
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
          {slots.map((slot) => (
            <div key={slot.startHour} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-14 shrink-0">{slot.label}</span>
              {(["new", "existing"] as const).map((ct) => {
                const key = `${slot.startHour}-${ct}`;
                const count = slotCounts[key] ?? 0;
                const isFlashing = flash === key;
                return (
                  <div key={ct} className="flex-1 flex items-stretch gap-1">
                    <button
                      onClick={() => tap(slot.startHour, ct)}
                      disabled={pending === key}
                      className={`flex-1 flex items-center justify-between px-3 py-2 md:py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                        isFlashing ? "bg-emerald-100 border-emerald-400" : "border-slate-300 hover:bg-slate-50 active:bg-slate-100"
                      }`}
                    >
                      <span className="text-xs capitalize">+1 {ct}</span>
                      <span className="text-base font-semibold">{count}</span>
                    </button>
                    <button
                      onClick={() => undo(slot.startHour, ct)}
                      disabled={pending === `undo-${key}` || count === 0}
                      aria-label={`Remove one ${ct} visitor from ${slot.label}`}
                      className="w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 disabled:opacity-30"
                    >
                      <Minus size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
