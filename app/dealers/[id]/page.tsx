import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import DealerForm from "@/components/DealerForm";
import DealerComments from "@/components/DealerComments";
import DealerTasks from "@/components/DealerTasks";
import DealerHistory from "@/components/DealerHistory";
import DealerTabs from "@/components/DealerTabs";
import DealerOrdersTab from "@/components/DealerOrdersTab";
import DealerWaitingItemsTab from "@/components/DealerWaitingItemsTab";
import DealerQuickStats from "@/components/DealerQuickStats";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDuration } from "@/lib/formatDuration";
import { getCurrentFiscalYearBounds, remainingFiscalQuarters } from "@/lib/fiscalYear";
import { computeItemStatus } from "@/lib/orderItemStatus";
import { dealerStatusBadge } from "@/lib/statusColors";
import { buildAuthorNameMap, resolveAuthor } from "@/lib/userNames";

export const dynamic = "force-dynamic";

export default async function DealerCardPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: dealer } = await supabase.from("dealers").select("*").eq("id", params.id).single();
  if (!dealer) notFound();

  const { startStr, endStr, label: fyLabel } = getCurrentFiscalYearBounds();

  // Everything below is independent of everything else at this point (none
  // of these queries need each other's results), so they run in parallel —
  // previously they ran one after another, adding up to several times the
  // latency of a single round trip before the page could render at all.
  const [{ data: comments }, { data: tasks }, { data: history }, { data: orders }, { data: profiles }, { data: paidItems }] = await Promise.all([
    supabase.from("dealer_comments").select("*").eq("dealer_id", params.id).order("created_at", { ascending: false }),
    supabase.from("tasks").select("*").eq("dealer_id", params.id).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("dealer_history").select("*").eq("dealer_id", params.id).order("changed_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, order_number, status, order_date, currency, created_by, order_items(id, sku, product_name, quantity, unit_price, total)")
      .eq("dealer_id", params.id)
      .order("order_date", { ascending: false }),
    supabase.from("profiles").select("email, first_name, last_name"),
    supabase
      .from("invoice_items")
      .select("total, invoices!inner(dealer_id, status, invoice_date)")
      .eq("invoices.dealer_id", params.id)
      .eq("invoices.status", "Paid")
      .gte("invoices.invoice_date", startStr)
      .lte("invoices.invoice_date", endStr),
  ]);
  const authorNames = buildAuthorNameMap(profiles ?? []);

  // This one genuinely has to wait — it needs the order item ids from the
  // orders query above.
  const allItemIds = (orders ?? []).flatMap((o: any) => o.order_items.map((i: any) => i.id));
  const invoicedQtyByItem: Record<string, number> = {};
  if (allItemIds.length > 0) {
    const { data: invItems } = await supabase
      .from("invoice_items")
      .select("order_item_id, quantity, invoices!inner(status)")
      .in("order_item_id", allItemIds)
      .neq("invoices.status", "Cancelled");
    for (const row of invItems ?? []) {
      if (!row.order_item_id) continue;
      invoicedQtyByItem[row.order_item_id] = (invoicedQtyByItem[row.order_item_id] ?? 0) + (Number(row.quantity) || 0);
    }
  }

  const invoicedPaidFY = (paidItems ?? []).reduce((s, it: any) => s + (Number(it.total) || 0), 0);

  const annualPlan = Number(dealer.annual_sales_plan) || 0;
  const expectedTillYearEnd = annualPlan - invoicedPaidFY;
  const remainingQuarters = remainingFiscalQuarters();
  const expectedThisQuarter = remainingQuarters > 0 ? expectedTillYearEnd / remainingQuarters : expectedTillYearEnd;

  let ordersTotal = 0;
  const waitingItems: { orderId: string; orderNumber: string; sku: string | null; productName: string | null; waitingQty: number; value: number }[] = [];

  const ordersForTab = (orders ?? []).map((o: any) => {
    let total = 0;
    for (const item of o.order_items) {
      const s = computeItemStatus(item.quantity, invoicedQtyByItem[item.id] ?? 0, o.status);
      if (s.label !== "Cancelled") total += Number(item.total) || 0;
      if (s.waitingQty > 0) {
        waitingItems.push({
          orderId: o.id,
          orderNumber: o.order_number,
          sku: item.sku,
          productName: item.product_name,
          waitingQty: s.waitingQty,
          value: s.waitingQty * (Number(item.unit_price) || 0),
        });
      }
    }
    ordersTotal += total;
    return {
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      order_date: o.order_date,
      currency: o.currency,
      total,
      author: resolveAuthor(o.created_by, authorNames),
    };
  });

  return (
    <AppShell>
      <Link href="/dealers" className="text-sm text-slate-500 hover:underline">
        ← All dealers
      </Link>
      <div className="flex items-center gap-3 mt-2 mb-6 flex-wrap">
        <h1 className="text-xl font-semibold">{dealer.company_name}</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${dealerStatusBadge(dealer.status)}`}>
          {dealer.status} · {formatDuration(dealer.status_changed_at)} in status
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <h2 className="font-medium mb-4">General Information</h2>
          <DealerForm dealer={dealer} />
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <DealerQuickStats
              ordersCount={ordersForTab.length}
              actualSales={invoicedPaidFY}
              achievementPct={annualPlan > 0 ? Math.round((invoicedPaidFY / annualPlan) * 100) : 0}
            />
            <h2 className="font-medium mb-3">Tasks</h2>
            <DealerTasks dealerId={dealer.id} tasks={tasks ?? []} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <DealerTabs
          tabs={[
            {
              key: "orders",
              label: "Orders",
              content: (
                <DealerOrdersTab
                  orders={ordersForTab}
                  ordersTotal={ordersTotal}
                  invoicedPaidFY={invoicedPaidFY}
                  annualPlan={annualPlan}
                  expectedTillYearEnd={expectedTillYearEnd}
                  expectedThisQuarter={expectedThisQuarter}
                  fiscalYearLabel={fyLabel}
                />
              ),
            },
            {
              key: "waiting",
              label: `Waiting Items${waitingItems.length > 0 ? ` (${waitingItems.length})` : ""}`,
              content: <DealerWaitingItemsTab items={waitingItems} currency="EUR" />,
            },
            {
              key: "comments",
              label: "Comments",
              content: <DealerComments dealerId={dealer.id} comments={comments ?? []} />,
            },
            {
              key: "history",
              label: "Change History",
              content: <DealerHistory history={history ?? []} />,
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
