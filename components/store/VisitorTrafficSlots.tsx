"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Minus } from "lucide-react";

type Slot = { startHour: number; label: string };

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

  function Cell({ startHour, ct }: { startHour: number; ct: "new" | "existing" }) {
    const key = `${startHour}-${ct}`;
    const count = slotCounts[key] ?? 0;
    return (
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => undo(startHour, ct)}
          disabled={pending === `undo-${key}` || count === 0}
          aria-label={`-1 ${ct} for ${startHour}:00`}
          className="w-5 h-5 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-30"
        >
          <Minus size={10} />
        </button>
        <span className="w-4 text-center text-sm font-medium tabular-nums">{count}</span>
        <button
          onClick={() => tap(startHour, ct)}
          disabled={pending === key}
          aria-label={`+1 ${ct} for ${startHour}:00`}
          className="w-5 h-5 flex items-center justify-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
        >
          <Plus size={10} />
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
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400">
              <th className="text-left font-normal pb-1 w-14">Slot</th>
              <th className="font-normal pb-1">New</th>
              <th className="font-normal pb-1">Existing</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.startHour} className="border-t border-slate-50">
                <td className="py-1 text-xs text-slate-400">{slot.label}</td>
                <td className="py-1">
                  <Cell startHour={slot.startHour} ct="new" />
                </td>
                <td className="py-1">
                  <Cell startHour={slot.startHour} ct="existing" />
                </td>
              </tr>
            ))}
            <tr className="border-t border-slate-200 font-medium">
              <td className="py-1.5 text-xs text-slate-500">Total</td>
              <td className="py-1.5 text-center">{totalNew}</td>
              <td className="py-1.5 text-center">{totalExisting}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
