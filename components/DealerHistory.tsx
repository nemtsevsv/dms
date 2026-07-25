import { format } from "date-fns";

type HistoryRow = {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;
};

const fieldLabels: Record<string, string> = {
  status: "Status",
  company_name: "Company Name",
  assigned_manager: "Assigned Manager",
  discount_percent: "Dealer Discount %",
  annual_sales_plan: "Annual Sales Plan",
};

export default function DealerHistory({ history }: { history: HistoryRow[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-slate-400">No changes recorded yet</p>;
  }
  return (
    <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {history.map((h) => (
        <li key={h.id} className="text-xs border-b border-slate-100 pb-2">
          <div className="flex justify-between text-slate-400 mb-0.5">
            <span>{h.changed_by ?? "System"}</span>
            <span>{format(new Date(h.changed_at), "dd.MM.yyyy HH:mm")}</span>
          </div>
          <div>
            <span className="font-medium">{fieldLabels[h.field_name] ?? h.field_name}</span>:{" "}
            <span className="text-slate-500">{h.old_value ?? "—"}</span> →{" "}
            <span className="text-slate-700">{h.new_value ?? "—"}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
