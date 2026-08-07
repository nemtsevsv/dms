import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import MarketingCalendarMonth from "@/components/MarketingCalendarMonth";
import { toDateStr } from "@/lib/calendarMonth";
import { ACTIVITY_STATUSES } from "@/lib/marketingStatusColors";

export const dynamic = "force-dynamic";

export default async function MarketingDashboardPage() {
  const supabase = createClient();
  const now = new Date();

  const prev = { year: now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(), month: now.getMonth() === 0 ? 12 : now.getMonth() };
  const current = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const next = { year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(), month: now.getMonth() === 11 ? 1 : now.getMonth() + 2 };

  // Wide enough range to cover all three visible month grids (including the
  // leading/trailing days from neighboring months shown to fill the grid).
  const rangeStart = toDateStr(new Date(prev.year, prev.month - 1, 1 - 7));
  const rangeEnd = toDateStr(new Date(next.year, next.month, 7));

  const { data: activities } = await supabase
    .from("marketing_activities")
    .select("id, name, start_date, end_date, status")
    .lte("start_date", rangeEnd)
    .gte("end_date", rangeStart)
    .order("start_date");

  const rows = activities ?? [];

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Marketing Dashboard</h1>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {ACTIVITY_STATUSES.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.hex }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MarketingCalendarMonth year={prev.year} month={prev.month} activities={rows} />
        <MarketingCalendarMonth year={current.year} month={current.month} activities={rows} highlightToday />
        <MarketingCalendarMonth year={next.year} month={next.month} activities={rows} />
      </div>
    </AppShell>
  );
}
