"use client";

import { formatThousandsRoundUp } from "@/lib/formatK";

type MonthData = { label: string; sales: number };
type LineSeries = { key: string; label: string; color: string; values: number[] };

// Overlay lines live in the lower-middle portion of the chart — high
// enough that they never collide with the month labels sitting right at
// the bottom, low enough to stay clear of the sales bars' own value labels.
const BAND_TOP = 40;
const BAND_BOTTOM = 82;
const BAND_STEP = 10; // vertical offset between stacked lines so they don't all overlap exactly

function scaleLine(values: number[], top: number, bottom: number) {
  const min = Math.min(...values);
  const max = Math.max(...values, 1);
  return (v: number) => {
    if (max === min) return (top + bottom) / 2;
    const pct = (v - min) / (max - min);
    return bottom - pct * (bottom - top);
  };
}

export default function MarketingTrendChart({ data, barColor, barLabel, lines }: { data: MonthData[]; barColor: string; barLabel: string; lines: LineSeries[] }) {
  const maxBar = Math.max(...data.map((d) => d.sales), 1);

  const scaledLines = lines.map((line, i) => {
    const top = BAND_TOP + i * BAND_STEP;
    const bottom = Math.min(top + (BAND_BOTTOM - BAND_TOP) / lines.length + BAND_STEP, BAND_BOTTOM);
    const scaleFn = scaleLine(line.values, top, bottom);
    return { ...line, scaleFn };
  });

  return (
    <div>
      <div className="flex items-center gap-4 text-xs mb-3 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: barColor }} /> {barLabel}
        </span>
        {lines.map((line) => (
          <span key={line.key} className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 inline-block" style={{ backgroundColor: line.color }} /> {line.label}
          </span>
        ))}
      </div>
      <div className="relative h-52">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          {scaledLines.map((line) => {
            const points = line.values.map((v, i) => `${((i + 0.5) / line.values.length) * 100},${line.scaleFn(v)}`).join(" ");
            return (
              <g key={line.key}>
                <polyline points={points} fill="none" stroke={line.color} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                {line.values.map((v, i) => (
                  <circle key={i} cx={((i + 0.5) / line.values.length) * 100} cy={line.scaleFn(v)} r="1" fill={line.color} />
                ))}
              </g>
            );
          })}
        </svg>
        <div className="flex items-end gap-1 h-full relative">
          {data.map((d, i) => (
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
