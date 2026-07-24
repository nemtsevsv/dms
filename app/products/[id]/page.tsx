import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import ProductForm from "@/components/ProductForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProductCardPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: product } = await supabase.from("products").select("*").eq("id", params.id).single();
  if (!product) notFound();

  return (
    <AppShell>
      <Link href="/products" className="text-sm text-slate-500 hover:underline">
        ← Все продукты
      </Link>
      <h1 className="text-xl font-semibold mt-2 mb-6">{product.product_name}</h1>
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-xl">
        <ProductForm product={product} />
      </div>
    </AppShell>
  );
}
