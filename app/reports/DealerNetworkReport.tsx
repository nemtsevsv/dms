import ConversionFunnel from "@/components/ConversionFunnel";

export default function DealerNetworkReport({
  dealers,
  newDealersCurrentQ,
  newDealersPrevQ,
  signedCurrentQ,
  signedPrevQ,
  currentQLabel,
  prevQLabel,
}: {
  dealers: { status: string }[];
  newDealersCurrentQ: number;
  newDealersPrevQ: number;
  signedCurrentQ: number;
  signedPrevQ: number;
  currentQLabel: string;
  prevQLabel: string;
}) {
  function delta(current: number, prev: number) {
    if (prev === 0) return current > 0 ? "+100%" : "0%";
    const pct = Math.round(((current - prev) / prev) * 100);
    return `${pct >= 0 ? "+" : ""}${pct}%`;
  }

  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-8">
        <h2 className="font-medium mb-4">Dealer Conversion Funnel (all dealers, current status)</h2>
        <ConversionFunnel dealers={dealers} />
      </div>

      <h2 className="font-medium mb-3">Quarter-over-Quarter Comparison</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
    </div>
  );
}
