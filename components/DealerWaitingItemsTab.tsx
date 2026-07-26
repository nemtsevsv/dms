import Link from "next/link";

type WaitingItem = {
  orderId: string;
  orderNumber: string;
  sku: string | null;
  productName: string | null;
  waitingQty: number;
  value: number;
};

export default function DealerWaitingItemsTab({ items, currency }: { items: WaitingItem[]; currency: string }) {
  const totalSum = items.reduce((s, i) => s + i.value, 0);

  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm mb-4">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">SKU</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-right px-4 py-3">Waiting Qty</th>
              <th className="text-right px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/orders/${i.orderId}`} className="font-medium hover:underline">
                    {i.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{i.sku}</td>
                <td className="px-4 py-3">{i.productName}</td>
                <td className="px-4 py-3 text-right text-amber-700 font-medium">{i.waitingQty}</td>
                <td className="px-4 py-3 text-right">{i.value.toLocaleString("de-DE")}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  Nothing waiting — everything has been invoiced or the orders are closed
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {items.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm">
          Total waiting value: <span className="font-semibold">{totalSum.toLocaleString("de-DE")} {currency}</span>
        </div>
      )}
    </div>
  );
}
