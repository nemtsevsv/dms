export function achievementColorClass(pct: number): string {
  if (pct <= 30) return "text-red-600";
  if (pct <= 50) return "text-orange-500";
  if (pct <= 75) return "text-yellow-600";
  return "text-emerald-600";
}
