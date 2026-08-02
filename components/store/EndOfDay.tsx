"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProgressBar from "./ProgressBar";
import { Check } from "lucide-react";

export default function EndOfDay({
  storeId,
  reportDate,
  existingSelfEval,
  dailyAchievementPct,
  monthAchievementPct,
  visitors,
  receipts,
  callsThisWeekPct,
  testDrivesThisWeekPct,
}: {
  storeId: string;
  reportDate: string;
  existingSelfEval: number | null;
  dailyAchievementPct: number;
  monthAchievementPct: number;
  visitors: number;
  receipts: number;
  callsThisWeekPct: number;
  testDrivesThisWeekPct: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [value, setValue] = useState(existingSelfEval ?? 3);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const conversionPct = visitors > 0 ? (receipts / visitors) * 100 : 0;

  async function save(newValue: number) {
    setValue(newValue);
    setSaving(true);
    await supabase.from("daily_reports").update({ self_evaluation: newValue }).eq("store_id", storeId).eq("report_date", reportDate);
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-5">
      <h2 className="font-medium">Today's summary</h2>

      <div className="space-y-3">
        <ProgressBar label="Target achievement (today)" pct={dailyAchievementPct} colorClass="bg-emerald-600" />
        <ProgressBar label="Target achievement (this month)" pct={monthAchievementPct} colorClass="bg-slate-900" />
        <ProgressBar label="Conversion rate" pct={conversionPct} hint={`${receipts} receipts / ${visitors} visitors`} colorClass="bg-blue-600" />
        <ProgressBar label="Calls/Messages KPI (35/week)" pct={callsThisWeekPct} colorClass="bg-amber-500" />
        <ProgressBar label="Test-Drives KPI (10/week)" pct={testDrivesThisWeekPct} colorClass="bg-amber-500" />
      </div>

      <div>
        <div className="text-sm font-medium text-slate-700 mb-2">Self evaluation</div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => save(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
            <Check size={12} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
