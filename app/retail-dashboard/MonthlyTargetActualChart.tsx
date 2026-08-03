"use client";

import { formatThousandsRoundUp } from "@/lib/formatK";

type MonthData = { label: string; target: number; actual: number; traffic: number };

// Traffic line is scaled into a centered band of the chart (not 0-100%) so
// its ups and downs stay clearly readable in the middle of the chart,
// instead of hugging the bottom edge or hiding behind tall bars.
const BAND_TOP = 20;
const BAND_BOTTOM = 70;

export default function MonthlyTargetActualChart({ data }: { data: MonthData[] }) {
  const maxBar = Math.max(...data.map((d) => Math.max(d.target, d.actual)), 1);
  const trafficValues = data.map((d) => d.traffic);
  const minTraffic = Math.min(...trafficValues);
  const maxTraffic = Math.max(...trafficValues, 1);

  function trafficY(traffic: number) {
    if (maxTraffic === minTraffic) return (BAND_TOP + BAND_BOTTOM) / 2;
    const pct = (traffic - minTraffic) / (maxTraffic - minTraffic);
    return BAND_BOTTOM - pct * (BAND_BOTTOM - BAND_TOP);
  }

  const points = data.map((d, i) => `${((i + 0.5) / data.length) * 100},${trafficY(d.traffic)}`).join(" ");

  return (
    <div>
      <div className="flex items-center gap-4 text-xs mb-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block" /> Sales Target
        </span>
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
          {data.map((d, i) => {
            const x = ((i + 0.5) / data.length) * 100;
            return <circle key={i} cx={x} cy={trafficY(d.traffic)} r="1.2" fill="#3b82f6" />;
          })}
        </svg>
        <div className="flex items-end gap-1 h-full relative">
          {data.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="flex items-end gap-0.5 h-full w-full justify-center">
                <div className="flex flex-col items-center justify-end h-full">
                  {d.target > 0 && <span className="text-[8px] text-slate-500 mb-0.5 whitespace-nowrap">{formatThousandsRoundUp(d.target)}</span>}
                  <div
                    className="w-2 sm:w-2.5 bg-slate-300 rounded-t"
                    style={{ height: `${(d.target / maxBar) * 100}%` }}
                    title={`Target: ${Math.round(d.target).toLocaleString("de-DE")} EUR`}
                  />
                </div>
                <div className="flex flex-col items-center justify-end h-full">
                  {d.actual > 0 && <span className="text-[8px] text-emerald-700 mb-0.5 whitespace-nowrap">{formatThousandsRoundUp(d.actual)}</span>}
                  <div
                    className="w-2 sm:w-2.5 bg-emerald-500 rounded-t"
                    style={{ height: `${(d.actual / maxBar) * 100}%` }}
                    title={`Actual: ${Math.round(d.actual).toLocaleString("de-DE")} EUR`}
                  />
                </div>
              </div>
              <span className="text-[9px] text-slate-400">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
