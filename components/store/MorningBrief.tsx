"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Minus, Plus } from "lucide-react";
import SegmentedRating from "./SegmentedRating";

type Report = {
  staff_count: number | null;
  weather: number | null;
  season: number | null;
  expected_visitors: number | null;
  expected_customers: number | null;
  inventory_available: number | null;
  supply_pipeline: number | null;
};

export default function MorningBrief({
  storeId,
  reportDate,
  existing,
  dailyTarget,
  currency,
  workingHours,
}: {
  storeId: string;
  reportDate: string;
  existing: Report | null;
  dailyTarget: number;
  currency: string;
  workingHours: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(!existing);
  const [form, setForm] = useState<Report>(
    existing ?? { staff_count: 1, weather: 3, season: 3, expected_visitors: 3, expected_customers: 3, inventory_available: 3, supply_pipeline: 3 }
  );
  const [saving, setSaving] = useState(false);

  function update<K extends keyof Report>(field: K, value: Report[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("daily_reports").upsert(
      { store_id: storeId, report_date: reportDate, ...form, submitted_by: user?.email ?? null, updated_at: new Date().toISOString() },
      { onConflict: "store_id,report_date" }
    );
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  const row = "grid grid-cols-1 gap-1 mb-4";
  const label = "text-sm font-medium text-slate-700";

  if (!editing) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Morning brief</h2>
          <button onClick={() => setEditing(true)} className="text-xs text-slate-500 underline">
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-400">Staff on shift</div>
            <div className="font-medium">{form.staff_count} · {(workingHours * (form.staff_count ?? 0)).toFixed(0)}h total</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Today's target</div>
            <div className="font-medium">
              {dailyTarget.toLocaleString("de-DE")} {currency}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <h2 className="font-medium mb-4">Morning brief</h2>

      <div className={row}>
        <span className={label}>Staff on shift</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => update("staff_count", Math.max(0, (form.staff_count ?? 0) - 1))}
            className="w-11 h-11 flex items-center justify-center rounded-full border border-slate-300 text-slate-600 active:bg-slate-100"
          >
            <Minus size={18} />
          </button>
          <span className="text-2xl font-semibold w-10 text-center">{form.staff_count}</span>
          <button
            type="button"
            onClick={() => update("staff_count", (form.staff_count ?? 0) + 1)}
            className="w-11 h-11 flex items-center justify-center rounded-full border border-slate-300 text-slate-600 active:bg-slate-100"
          >
            <Plus size={18} />
          </button>
          <span className="text-xs text-slate-400">= {(workingHours * (form.staff_count ?? 0)).toFixed(0)}h working hours today</span>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg px-3 py-2 mb-4 text-sm">
        Today's target: <span className="font-semibold">{dailyTarget.toLocaleString("de-DE")} {currency}</span>
      </div>

      <div className={row}>
        <span className={label}>Weather</span>
        <SegmentedRating value={form.weather ?? 3} onChange={(v) => update("weather", v)} />
      </div>
      <div className={row}>
        <span className={label}>Season</span>
        <SegmentedRating value={form.season ?? 3} onChange={(v) => update("season", v)} />
      </div>
      <div className={row}>
        <span className={label}>Expected visitors</span>
        <SegmentedRating value={form.expected_visitors ?? 3} onChange={(v) => update("expected_visitors", v)} />
      </div>
      <div className={row}>
        <span className={label}>Expected customers</span>
        <SegmentedRating value={form.expected_customers ?? 3} onChange={(v) => update("expected_customers", v)} />
      </div>
      <div className={row}>
        <span className={label}>Inventory available</span>
        <SegmentedRating value={form.inventory_available ?? 3} onChange={(v) => update("inventory_available", v)} />
      </div>
      <div className={row}>
        <span className={label}>Supply pipeline</span>
        <SegmentedRating value={form.supply_pipeline ?? 3} onChange={(v) => update("supply_pipeline", v)} />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Start the day"}
      </button>
    </div>
  );
}
