import { getCurrentFiscalYearBounds } from "@/lib/fiscalYear";

export default function FiscalYearBadge() {
  const { label } = getCurrentFiscalYearBounds();
  return <span className="text-xs text-slate-400 whitespace-nowrap">Fiscal year: {label} (Apr–Mar)</span>;
}
