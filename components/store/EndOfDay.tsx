"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProgressBar from "./ProgressBar";
import { Check, Lock } from "lucide-react";
import { format } from "date-fns";

const SLIDER_GRADIENT = "linear-gradient(to right, #ef4444, #f97316, #eab308, #84cc16, #22c55e)";

export default function EndOfDay({
  storeId,
  reportDate,
  existingSelfEval,
  dailyAchievementPct,
  monthAchievementPct,
  visitors,
  newVisitors,
  receipts,
  salesTotal,
  callsThisWeekPct,
  testDrivesThisWeekPct,
  closedAt,
  closedBy,
  onChange,
}: {
  storeId: string;
  reportDate: string;
  existingSelfEval: number | null;
  dailyAchievementPct: number;
  monthAchievementPct: number;
  visitors: number;
  newVisitors: number;
  receipts: number;
  salesTotal: number;
  callsThisWeekPct: number;
  testDrivesThisWeekPct: number;
  closedAt: string | null;
  closedBy: string | null;
  onChange?: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [value, setValue] = useState(existingSelfEval ?? 3);
  const [answered, setAnswered] = useState(existingSelfEval !== null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [closing, setClosing] = useState(false);

  const conversionPct = visitors > 0 ? (receipts / visitors) * 100 : 0;
  const newVisitorRatePct = visitors > 0 ? (newVisitors / visitors) * 100 : 0;
  const avgReceipt = receipts > 0 ? salesTotal / receipts : 0;
  const avgSalePerVisitor = visitors > 0 ? salesTotal / visitors : 0;

  async function save(newValue: number) {
    setValue(newValue);
    setAnswered(true);
    setSaving(true);
    await supabase.from("daily_reports").update({ self_evaluation: newValue }).eq("store_id", storeId).eq("report_date", reportDate);
    setSaving(false);
    setSaved(true);
    router.refresh();
    onChange?.();
    setTimeout(() => setSaved(false), 1500);
  }

  async function closeDay() {
    if (!answered) return;
    setClosing(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("daily_reports")
      .update({ closed_at: new Date().toISOString(), closed_by: user?.email ?? null })
      .eq("store_id", storeId)
      .eq("report_date", reportDate);
    setClosing(false);
    router.refresh();
    onChange?.();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-5">
      <h2 className="font-medium">Today's summary</h2>

      <div className="space-y-3">
        <ProgressBar label="Target achievement (today)" pct={dailyAchievementPct} colorClass="bg-emerald-600" />
        <ProgressBar label="Target achievement (this month)" pct={monthAchievementPct} colorClass="bg-slate-900" />
        <ProgressBar label="Conversion rate" pct={conversionPct} hint={`${receipts} receipts / ${visitors} visitors`} colorClass="bg-blue-600" />
        <ProgressBar label="New visitor rate" pct={newVisitorRatePct} hint={`${newVisitors} new / ${visitors} total`} colorClass="bg-sky-500" />
        <ProgressBar label="Calls/Messages KPI (35/week)" pct={callsThisWeekPct} colorClass="bg-amber-500" />
        <ProgressBar label="Test-Drives KPI (10/week)" pct={testDrivesThisWeekPct} colorClass="bg-amber-500" />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-slate-400">Avg. sale per receipt</div>
          <div className="font-medium">{avgReceipt.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Avg. sale per visitor</div>
          <div className="font-medium">{avgSalePerVisitor.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            Self evaluation <span className="text-red-500">*</span>
          </span>
          {!answered && <span className="text-xs text-amber-600">Required before closing the day</span>}
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => save(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ background: SLIDER_GRADIENT }}
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

      <div className="pt-2 border-t border-slate-100">
        {closedAt ? (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2.5">
            <Lock size={14} />
            Report closed {format(new Date(closedAt), "dd.MM.yyyy HH:mm")} by {closedBy ?? "—"}
          </div>
        ) : (
          <button
            onClick={closeDay}
            disabled={!answered || closing}
            title={!answered ? "Set your self evaluation first" : undefined}
            className="w-full py-3 md:py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-40"
          >
            {closing ? "Closing..." : "Close the day"}
          </button>
        )}
      </div>
    </div>
  );
}
