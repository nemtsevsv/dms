// Single source of truth for marketing activity status colors — same
// pattern as lib/statusColors.ts for dealers.
export const ACTIVITY_STATUSES = [
  { name: "Planned", hex: "#94a3b8", badge: "bg-slate-100 text-slate-600" },
  { name: "Active", hex: "#22c55e", badge: "bg-emerald-100 text-emerald-700" },
  { name: "Completed", hex: "#60a5fa", badge: "bg-blue-100 text-blue-700" },
  { name: "Cancelled", hex: "#ef4444", badge: "bg-red-100 text-red-700" },
];

export function activityStatusHex(name: string) {
  return ACTIVITY_STATUSES.find((s) => s.name === name)?.hex ?? "#94a3b8";
}

export function activityStatusBadge(name: string) {
  return ACTIVITY_STATUSES.find((s) => s.name === name)?.badge ?? "bg-slate-100 text-slate-600";
}
