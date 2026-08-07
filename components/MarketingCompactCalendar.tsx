"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildMonthGrid, MONTH_NAMES, WEEKDAY_LABELS, toDateStr } from "@/lib/calendarMonth";
import { activityStatusHex, activityStatusBadge } from "@/lib/marketingStatusColors";

type Activity = { id: string; name: string; start_date: string; end_date: string; status: string };

export default function MarketingCompactCalendar({ activities }: { activities: Activity[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const todayStr = toDateStr(now);

  function go(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  const weeks = buildMonthGrid(year, month);

  function activitiesOn(dateStr: string) {
    return activities.filter((a) => a.start_date <= dateStr && a.end_date >= dateStr);
  }

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const monthActivities = useMemo(
    () => activities.filter((a) => a.start_date.slice(0, 7) <= monthKey && a.end_date.slice(0, 7) >= monthKey).sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [activities, monthKey]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <button onClick={() => go(-1)} aria-label="Previous month" className="text-slate-400 hover:text-slate-800 p-1">
            <ChevronLeft size={16} />
          </button>
          <h3 className="font-medium text-sm">
            {MONTH_NAMES[month - 1]} {year}
          </h3>
          <button onClick={() => go(1)} aria-label="Next month" className="text-slate-400 hover:text-slate-800 p-1">
            <ChevronRight size={16} />
          </button>
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
                const isToday = day.dateStr === todayStr;
                return (
                  <div key={day.dateStr} className={`min-h-[70px] px-1 py-1 border-r border-slate-50 last:border-0 ${day.inMonth ? "" : "bg-slate-50/50"}`}>
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

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Activities — {MONTH_NAMES[month - 1]} {year}
        </h3>
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {monthActivities.map((a) => (
            <Link key={a.id} href={`/marketing-activities/${a.id}`} className="block px-2.5 py-2 rounded-lg hover:bg-slate-50 border border-slate-100">
              <div className="text-xs font-medium text-slate-700 truncate">{a.name}</div>
              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${activityStatusBadge(a.status)}`}>{a.status}</span>
            </Link>
          ))}
          {monthActivities.length === 0 && <p className="text-xs text-slate-400">No activities this month</p>}
        </div>
      </div>
    </div>
  );
}
