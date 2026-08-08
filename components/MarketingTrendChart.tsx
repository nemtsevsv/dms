"use client";

import { formatThousandsRoundUp } from "@/lib/formatK";

type MonthData = { label: string; sales: number; eventCount: number; reach: number };

// The two overlay lines live in the bottom portion of the chart ("in the
// lower part", as requested) so they never compete visually with the
// sales bars, which grow up from the bottom.
const EVENTS_BAND = { top: 78, bottom: 92 };
const REACH_BAND = { top: 84, bottom: 98 };

function scaleLine(values: number[], band: { top: number; bottom: number }) {
  const min = Math.min(...values);
  const max = Math.max(...values, 1);
  return (v: number) => {
    if (max === min) return (band.top + band.bottom) / 2;
    const pct = (v - min) / (max - min);
    return band.bottom - pct * (band.bottom - band.top);
  };
}

export default function MarketingTrendChart({ data, barColor, barLabel }: { data: MonthData[]; barColor: string; barLabel: string }) {
  const maxBar = Math.max(...data.map((d) => d.sales), 1);
  const eventsY = scaleLine(data.map((d) => d.eventCount), EVENTS_BAND);
  const reachY = scaleLine(data.map((d) => d.reach), REACH_BAND);

  const eventsPoints = data.map((d, i) => `${((i + 0.5) / data.length) * 100},${eventsY(d.eventCount)}`).join(" ");
  const reachPoints = data.map((d, i) => `${((i + 0.5) / data.length) * 100},${reachY(d.reach)}`).join(" ");

  return (
    <div>
      <div className="flex items-center gap-4 text-xs mb-3 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: barColor }} /> {barLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-amber-500 inline-block" /> Activities
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-violet-500 inline-block" /> Reach
        </span>
      </div>
      <div className="relative h-52">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <polyline points={eventsPoints} fill="none" stroke="#f59e0b" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <polyline points={reachPoints} fill="none" stroke="#8b5cf6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {data.map((d, i) => {
            const x = ((i + 0.5) / data.length) * 100;
            return (
              <g key={i}>
                <circle cx={x} cy={eventsY(d.eventCount)} r="1" fill="#f59e0b" />
                <circle cx={x} cy={reachY(d.reach)} r="1" fill="#8b5cf6" />
              </g>
            );
          })}
        </svg>
        <div className="flex items-end gap-1 h-full relative">
          {data.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              {d.sales > 0 && <span className="text-[8px] text-slate-500 whitespace-nowrap">{formatThousandsRoundUp(d.sales)} EUR</span>}
              <div
                className="w-2.5 sm:w-3 rounded-t"
                style={{ height: `${(d.sales / maxBar) * 100}%`, backgroundColor: barColor }}
                title={`${barLabel}: ${Math.round(d.sales).toLocaleString("de-DE")}`}
              />
              <span className="text-[9px] text-slate-400">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
