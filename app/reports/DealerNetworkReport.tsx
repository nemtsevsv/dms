import ConversionFunnel from "@/components/ConversionFunnel";
import AvgTimeInStatus from "./AvgTimeInStatus";
import StaleDealersPanel from "./StaleDealersPanel";

export default function DealerNetworkReport({
  dealers,
  newDealersCurrentQ,
  newDealersPrevQ,
  signedCurrentQ,
  signedPrevQ,
  currentQLabel,
  prevQLabel,
  avgTimeInStatus,
  avgFirstContactToSigning,
  avgFirstContactToFirstOrder,
  staleGroups,
}: {
  dealers: { status: string }[];
  newDealersCurrentQ: number;
  newDealersPrevQ: number;
  signedCurrentQ: number;
  signedPrevQ: number;
  currentQLabel: string;
  prevQLabel: string;
  avgTimeInStatus: { status: string; avgDays: number; count: number }[];
  avgFirstContactToSigning: number | null;
  avgFirstContactToFirstOrder: number | null;
  staleGroups: { status: string; thresholdDays: number; dealers: { id: string; company_name: string; days: number }[] }[];
}) {
  function delta(current: number, prev: number) {
    if (prev === 0) return current > 0 ? "+100%" : "0%";
    const pct = Math.round(((current - prev) / prev) * 100);
    return `${pct >= 0 ? "+" : ""}${pct}%`;
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-medium mb-4">Conversion Funnel</h2>
          <ConversionFunnel dealers={dealers} />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-medium mb-4">Avg. Time in Status</h2>
          <AvgTimeInStatus data={avgTimeInStatus} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex-1">
            <div className="text-xs font-medium text-slate-500 mb-1">Avg. First Contact → Contract Signing</div>
            <div className="text-2xl font-semibold">{avgFirstContactToSigning ?? "—"}{avgFirstContactToSigning !== null && " days"}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex-1">
            <div className="text-xs font-medium text-slate-500 mb-1">Avg. First Contact → First Order</div>
            <div className="text-2xl font-semibold">{avgFirstContactToFirstOrder ?? "—"}{avgFirstContactToFirstOrder !== null && " days"}</div>
          </div>
        </div>
      </div>

      <h2 className="font-medium mb-3">Quarter-over-Quarter Comparison</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">New Dealers Added — {currentQLabel}</div>
          <div className="text-2xl font-semibold">{newDealersCurrentQ}</div>
          <div className="text-xs text-slate-400 mt-1">
            {prevQLabel}: {newDealersPrevQ} · {delta(newDealersCurrentQ, newDealersPrevQ)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Dealers Signed (became Active) — {currentQLabel}</div>
          <div className="text-2xl font-semibold text-emerald-600">{signedCurrentQ}</div>
          <div className="text-xs text-slate-400 mt-1">
            {prevQLabel}: {signedPrevQ} · {delta(signedCurrentQ, signedPrevQ)}
          </div>
        </div>
      </div>

      <h2 className="font-medium mb-3">Dealers Needing Attention</h2>
      <StaleDealersPanel groups={staleGroups} />
    </div>
  );
}
