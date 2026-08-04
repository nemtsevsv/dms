import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import DealerTable from "@/components/DealerTable";
import { getCurrentFiscalYearBounds } from "@/lib/fiscalYear";
import { buildAuthorNameMap, resolveAuthor } from "@/lib/userNames";

export const dynamic = "force-dynamic";

export default async function DealersPage() {
  const supabase = createClient();
  const { startStr, endStr, label } = getCurrentFiscalYearBounds();

  const [{ data: dealers }, { data: invoices }, { data: profiles }] = await Promise.all([
    supabase
      .from("dealers")
      .select("id, status, company_name, country, city, annual_sales_plan, assigned_manager, product_categories, created_at")
      .order("company_name"),
    supabase
      .from("invoices")
      .select("dealer_id, invoice_date, status, invoice_items(total)")
      .neq("status", "Cancelled")
      .gte("invoice_date", startStr)
      .lte("invoice_date", endStr),
    supabase.from("profiles").select("email, first_name, last_name"),
  ]);
  const authorNames = buildAuthorNameMap(profiles ?? []);

  const actualSalesByDealer = new Map<string, number>();
  for (const inv of invoices ?? []) {
    const sum = (inv.invoice_items ?? []).reduce((s: number, it: any) => s + (Number(it.total) || 0), 0);
    actualSalesByDealer.set(inv.dealer_id, (actualSalesByDealer.get(inv.dealer_id) ?? 0) + sum);
  }

  const dealersWithSales = (dealers ?? []).map((d) => ({
    ...d,
    actual_sales: actualSalesByDealer.get(d.id) ?? 0,
    manager_name: resolveAuthor(d.assigned_manager, authorNames),
    product_categories: d.product_categories ?? [],
  }));

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Dealers</h1>
        <span className="text-xs text-slate-400">Actual Sales shown for current fiscal year: {label} (Apr–Mar)</span>
      </div>
      <DealerTable dealers={dealersWithSales} />
    </AppShell>
  );
}
