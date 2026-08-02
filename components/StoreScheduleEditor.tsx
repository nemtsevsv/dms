"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DAY_NAMES } from "@/lib/storeSchedule";
import { Check } from "lucide-react";

type Row = { day_of_week: number; is_open: boolean; open_time: string | null; close_time: string | null };

export default function StoreScheduleEditor({ storeId, schedule }: { storeId: string; schedule: Row[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const rows = Array.from({ length: 7 }, (_, day) => schedule.find((s) => s.day_of_week === day) ?? { day_of_week: day, is_open: false, open_time: "09:00", close_time: "18:00" });
  const [local, setLocal] = useState(rows);

  function update(day: number, patch: Partial<Row>) {
    setLocal((rows) => rows.map((r) => (r.day_of_week === day ? { ...r, ...patch } : r)));
  }

  async function save() {
    setSaving(true);
    await supabase.from("store_schedule").upsert(
      local.map((r) => ({ store_id: storeId, day_of_week: r.day_of_week, is_open: r.is_open, open_time: r.open_time, close_time: r.close_time })),
      { onConflict: "store_id,day_of_week" }
    );
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm mb-3">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Day</th>
              <th className="text-left px-4 py-3">Open</th>
              <th className="text-left px-4 py-3">From</th>
              <th className="text-left px-4 py-3">To</th>
            </tr>
          </thead>
          <tbody>
            {local.map((r) => (
              <tr key={r.day_of_week} className="border-t border-slate-100">
                <td className="px-4 py-3">{DAY_NAMES[r.day_of_week]}</td>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={r.is_open} onChange={(e) => update(r.day_of_week, { is_open: e.target.checked })} />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    disabled={!r.is_open}
                    value={r.open_time ?? ""}
                    onChange={(e) => update(r.day_of_week, { open_time: e.target.value })}
                    className="px-2 py-1 border border-slate-200 rounded disabled:opacity-40"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    disabled={!r.is_open}
                    value={r.close_time ?? ""}
                    onChange={(e) => update(r.day_of_week, { close_time: e.target.value })}
                    className="px-2 py-1 border border-slate-200 rounded disabled:opacity-40"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50">
          {saving ? "Saving..." : "Save schedule"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <Check size={14} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
