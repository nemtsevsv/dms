"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";

const ONLINE_FIELDS = [
  { key: "reach", label: "Reach" },
  { key: "clicks", label: "Clicks" },
  { key: "leads", label: "Leads" },
] as const;

const OFFLINE_FIELDS = [
  { key: "planned_participants", label: "Planned (invited)" },
  { key: "registered", label: "Registered" },
  { key: "participated", label: "Participated" },
  { key: "purchased", label: "Purchased" },
] as const;

export default function MarketingActivityResults({ activityId, activity }: { activityId: string; activity: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [saved, setSaved] = useState<string | null>(null);

  async function save(field: string, value: string) {
    const num = value.trim() === "" ? null : Number(value);
    await supabase.from("marketing_activities").update({ [field]: num, updated_at: new Date().toISOString() }).eq("id", activityId);
    setSaved(field);
    router.refresh();
    setTimeout(() => setSaved(null), 1200);
  }

  function Field({ field, label }: { field: string; label: string }) {
    return (
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <div className="relative">
          <input
            type="number"
            defaultValue={activity[field] ?? ""}
            onBlur={(e) => save(field, e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          {saved === field && <Check size={14} className="absolute right-2 top-2.5 text-emerald-600" />}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-w-3xl">
      <h2 className="font-medium mb-1">Results</h2>
      <p className="text-xs text-slate-400 mb-4">
        Filled in by hand as numbers come in — copy them over from Meta/Google Ads Manager, Mailchimp, or an event guest list. Only fill in what applies to this activity.
      </p>

      <div className="mb-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Online</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ONLINE_FIELDS.map((f) => (
            <Field key={f.key} field={f.key} label={f.label} />
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Offline / Events</div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {OFFLINE_FIELDS.map((f) => (
            <Field key={f.key} field={f.key} label={f.label} />
          ))}
        </div>
      </div>
    </div>
  );
}
