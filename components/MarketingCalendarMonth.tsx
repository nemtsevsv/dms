"use client";

import Link from "next/link";
import { buildMonthGrid, MONTH_NAMES, WEEKDAY_LABELS, toDateStr } from "@/lib/calendarMonth";
import { activityStatusHex } from "@/lib/marketingStatusColors";

type Activity = { id: string; name: string; start_date: string; end_date: string; status: string };

export default function MarketingCalendarMonth({
  year,
  month,
  activities,
  highlightToday,
}: {
  year: number;
  month: number;
  activities: Activity[];
  highlightToday?: boolean;
}) {
  const weeks = buildMonthGrid(year, month);
  const todayStr = toDateStr(new Date());

  function activitiesOn(dateStr: string) {
    return activities.filter((a) => a.start_date <= dateStr && a.end_date >= dateStr);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="font-medium text-sm">
          {MONTH_NAMES[month - 1]} {year}
        </h3>
      </div>
      <div className="grid grid-cols-7 text-[10px] text-slate-400 border-b border-slate-100">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center py-1.5">
            {d}
          </div>
        ))}
      </div>
      <div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-slate-50 last:border-0">
            {week.map((day) => {
              const dayActivities = activitiesOn(day.dateStr);
              const isToday = highlightToday && day.dateStr === todayStr;
              return (
                <div
                  key={day.dateStr}
                  className={`min-h-[64px] px-1 py-1 border-r border-slate-50 last:border-0 ${day.inMonth ? "" : "bg-slate-50/50"}`}
                >
                  <div className={`text-[10px] mb-0.5 ${isToday ? "inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-900 text-white" : day.inMonth ? "text-slate-500" : "text-slate-300"}`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayActivities.slice(0, 2).map((a) => (
                      <Link
                        key={a.id}
                        href={`/marketing-activities/${a.id}`}
                        title={a.name}
                        className="block text-[9px] leading-tight px-1 py-0.5 rounded truncate text-white hover:opacity-80"
                        style={{ backgroundColor: activityStatusHex(a.status) }}
                      >
                        {a.name}
                      </Link>
                    ))}
                    {dayActivities.length > 2 && <div className="text-[9px] text-slate-400 px-1">+{dayActivities.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
