// Single source of truth for dealer status colors, used by the status
// dropdown, dealer table badges and the dashboard conversion funnel.
export const DEALER_STATUSES = [
  { name: "New", hex: "#94a3b8", badge: "bg-slate-100 text-slate-600" },
  { name: "First Contact", hex: "#60a5fa", badge: "bg-blue-100 text-blue-700" },
  { name: "Negotiation", hex: "#fbbf24", badge: "bg-amber-100 text-amber-700" },
  { name: "Contract Signing", hex: "#fb923c", badge: "bg-orange-100 text-orange-700" },
  { name: "Active", hex: "#22c55e", badge: "bg-emerald-100 text-emerald-700" },
  { name: "Inactive", hex: "#ef4444", badge: "bg-red-100 text-red-700" },
  { name: "Declined", hex: "#78716c", badge: "bg-stone-200 text-stone-700" },
];

export function dealerStatusHex(name: string) {
  return DEALER_STATUSES.find((s) => s.name === name)?.hex ?? "#94a3b8";
}

export function dealerStatusBadge(name: string) {
  return DEALER_STATUSES.find((s) => s.name === name)?.badge ?? "bg-slate-100 text-slate-600";
}
