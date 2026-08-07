// Color coding for distribution margin — thresholds are set for typical
// distribution margins (10-30%), not the same scale as sales-target
// achievement, so a "normal" margin doesn't read as alarming.
export function marginColorClass(pct: number): string {
  if (pct < 0) return "text-red-600";
  if (pct < 10) return "text-orange-600";
  if (pct < 20) return "text-amber-600";
  return "text-emerald-600";
}

export function marginBgClass(pct: number): string {
  if (pct < 0) return "bg-red-50 border-red-200";
  if (pct < 10) return "bg-orange-50 border-orange-200";
  if (pct < 20) return "bg-amber-50 border-amber-200";
  return "bg-emerald-50 border-emerald-200";
}
