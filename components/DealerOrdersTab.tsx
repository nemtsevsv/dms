import Link from "next/link";
import KpiCard from "./KpiCard";
import { formatThousandsRoundUp } from "@/lib/formatK";

type Order = {
  id: string;
  order_number: string;
  status: string;
  order_date: string;
  currency: string;
  total: number;
  author: string;
};

export default function DealerOrdersTab({
  orders,
  ordersTotal,
  invoicedPaidFY,
  annualPlan,
  expectedTillYearEnd,
  expectedThisQuarter,
  fiscalYearLabel,
}: {
  orders: Order[];
  ordersTotal: number;
  invoicedPaidFY: number;
  annualPlan: number;
  expectedTillYearEnd: number;
  expectedThisQuarter: number;
  fiscalYearLabel: string;
}) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-3">Figures below are for the current fiscal year: {fiscalYearLabel} (Apr–Mar)</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Number of Orders" value={orders.length} />
        <KpiCard label="Total Orders Value" value={`${ordersTotal.toLocaleString("de-DE")}`} />
        <KpiCard label="Invoiced & Paid (FY)" value={`${invoicedPaidFY.toLocaleString("de-DE")}`} accent="success" />
        <KpiCard
          label="Expected Till Year End"
          value={formatThousandsRoundUp(Math.max(expectedTillYearEnd, 0))}
          hint={`≈ ${formatThousandsRoundUp(Math.max(expectedThisQuarter, 0))} this quarter to stay on plan`}
          accent={expectedTillYearEnd > 0 ? "warning" : "success"}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Author</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/orders/${o.id}`} className="font-medium hover:underline">
                    {o.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{o.order_date}</td>
                <td className="px-4 py-3 text-slate-500">{o.author}</td>
                <td className="px-4 py-3 text-slate-500">{o.status}</td>
                <td className="px-4 py-3 text-right">
                  {o.total.toLocaleString("de-DE")} {o.currency}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  No orders yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
