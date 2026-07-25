import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import ProductsTable from "@/components/ProductsTable";
import ProductImport from "@/components/ProductImport";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const supabase = createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, sku, product_name, brand, group_name, category, subgroup, list_price, dealer_price, retail_price_incl_vat")
    .order("product_name");

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Products</h1>
      <ProductImport />
      <ProductsTable products={products ?? []} />
    </AppShell>
  );
}
