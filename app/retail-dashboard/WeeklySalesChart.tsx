"use client";

import { formatThousandsRoundUp } from "@/lib/formatK";
import { isDayDataReady } from "@/lib/chartVisibility";

type DayData = { label: string; date: Date; actual: number; traffic: number };

const BAND_TOP = 20;
const BAND_BOTTOM = 70;

export default function WeeklySalesChart({ data }: { data: DayData[] }) {
  const ready = data.map((d) => isDayDataReady(d.date));
  const maxBar = Math.max(...data.map((d) => d.actual), 1);
  const trafficValues = data.filter((_, i) => ready[i]).map((d) => d.traffic);
  const minTraffic = Math.min(...trafficValues, 0);
  const maxTraffic = Math.max(...trafficValues, 1);

  function trafficY(traffic: number) {
    if (maxTraffic === minTraffic) return (BAND_TOP + BAND_BOTTOM) / 2;
    const pct = (traffic - minTraffic) / (maxTraffic - minTraffic);
    return BAND_BOTTOM - pct * (BAND_BOTTOM - BAND_TOP);
  }

  const points = data
    .map((d, i) => (ready[i] ? `${((i + 0.5) / data.length) * 100},${trafficY(d.traffic)}` : null))
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <div className="flex items-center gap-4 text-xs mb-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Actual Sales
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-blue-500 inline-block" /> Traffic
        </span>
      </div>
      <div className="relative h-52">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {data.map(
            (d, i) =>
              ready[i] && <circle key={i} cx={((i + 0.5) / data.length) * 100} cy={trafficY(d.traffic)} r="1.2" fill="#3b82f6" />
          )}
        </svg>
        {data.map(
          (d, i) =>
            ready[i] && (
              <span
                key={i}
                className="absolute text-[8px] text-blue-600 font-medium -translate-x-1/2 -translate-y-full whitespace-nowrap"
                style={{ left: `${((i + 0.5) / data.length) * 100}%`, top: `${trafficY(d.traffic)}%`, marginTop: "-3px" }}
              >
                {Math.round(d.traffic).toLocaleString("de-DE")}
              </span>
            )
        )}
        <div className="flex items-end gap-2 h-full relative">
          {data.map((d, i) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              {ready[i] && d.actual > 0 && <span className="text-[8px] text-emerald-700 whitespace-nowrap">{formatThousandsRoundUp(d.actual)}</span>}
              {ready[i] && (
                <div
                  className="w-4 sm:w-6 bg-emerald-500 rounded-t"
                  style={{ height: `${(d.actual / maxBar) * 100}%` }}
                  title={`${Math.round(d.actual).toLocaleString("de-DE")} EUR`}
                />
              )}
              <span className="text-[9px] text-slate-400">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
