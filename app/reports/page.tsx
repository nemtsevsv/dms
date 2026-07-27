import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import DealerTabs from "@/components/DealerTabs";
import SalesReport from "./SalesReport";
import DealerNetworkReport from "./DealerNetworkReport";
import { buildAuthorNameMap, resolveAuthor } from "@/lib/userNames";
import { getFiscalQuarterBounds } from "@/lib/fiscalYear";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = createClient();

  const { data: dealers } = await supabase.from("dealers").select("id, company_name, country, assigned_manager, status, created_at");
  const { data: profiles } = await supabase.from("profiles").select("email, first_name, last_name");
  const authorNames = buildAuthorNameMap(profiles ?? []);

  const dealerById = new Map((dealers ?? []).map((d) => [d.id, d]));

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, order_date, status, currency, dealer_id, order_items(id, quantity, total)")
    .order("order_date", { ascending: false });

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, invoice_date, status, currency, dealer_id, invoice_items(total)")
    .order("invoice_date", { ascending: false });

  const orderRows = (orders ?? []).map((o: any) => {
    const d = dealerById.get(o.dealer_id);
    const total = o.order_items.reduce((s: number, item: any) => s + (Number(item.total) || 0), 0);
    return {
      id: o.id,
      order_number: o.order_number,
      order_date: o.order_date,
      status: o.status,
      currency: o.currency,
      dealer_name: d?.company_name ?? "—",
      country: d?.country ?? "—",
      manager: resolveAuthor(d?.assigned_manager, authorNames),
      total: o.status === "Cancelled" ? 0 : total,
    };
  });

  const invoiceRows = (invoices ?? []).map((i: any) => {
    const d = dealerById.get(i.dealer_id);
    const total = (i.invoice_items ?? []).reduce((s: number, it: any) => s + (Number(it.total) || 0), 0);
    return {
      id: i.id,
      invoice_number: i.invoice_number,
      invoice_date: i.invoice_date,
      status: i.status,
      currency: i.currency,
      dealer_name: d?.company_name ?? "—",
      country: d?.country ?? "—",
      manager: resolveAuthor(d?.assigned_manager, authorNames),
      total: i.status === "Cancelled" ? 0 : total,
    };
  });

  // Dealer network report
  const { data: history } = await supabase
    .from("dealer_history")
    .select("dealer_id, field_name, new_value, changed_at")
    .eq("field_name", "status")
    .eq("new_value", "Active");

  const currentQ = getFiscalQuarterBounds(0);
  const prevQ = getFiscalQuarterBounds(1);

  const newDealersCurrentQ = (dealers ?? []).filter((d) => d.created_at >= currentQ.startStr && d.created_at <= currentQ.endStr + "T23:59:59").length;
  const newDealersPrevQ = (dealers ?? []).filter((d) => d.created_at >= prevQ.startStr && d.created_at <= prevQ.endStr + "T23:59:59").length;

  const signedCurrentQ = (history ?? []).filter((h) => h.changed_at >= currentQ.startStr && h.changed_at <= currentQ.endStr + "T23:59:59").length;
  const signedPrevQ = (history ?? []).filter((h) => h.changed_at >= prevQ.startStr && h.changed_at <= prevQ.endStr + "T23:59:59").length;

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Reports</h1>
      <DealerTabs
        tabs={[
          {
            key: "sales",
            label: "Sales Report",
            content: <SalesReport orders={orderRows} invoices={invoiceRows} />,
          },
          {
            key: "network",
            label: "Dealer Network Report",
            content: (
              <DealerNetworkReport
                dealers={(dealers ?? []).map((d) => ({ status: d.status }))}
                newDealersCurrentQ={newDealersCurrentQ}
                newDealersPrevQ={newDealersPrevQ}
                signedCurrentQ={signedCurrentQ}
                signedPrevQ={signedPrevQ}
                currentQLabel={currentQ.label}
                prevQLabel={prevQ.label}
              />
            ),
          },
        ]}
      />
    </AppShell>
  );
}
