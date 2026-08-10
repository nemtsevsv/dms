import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import HsCodesTable from "@/components/HsCodesTable";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HsCodesPage() {
  const supabase = createClient();
  const { data: codes } = await supabase.from("hs_codes").select("*").order("product_group").order("product");

  return (
    <AppShell>
      <Link href="/countries" className="text-sm text-slate-500 hover:underline">
        ← Countries
      </Link>
      <h1 className="text-xl font-semibold mt-2 mb-1">HS Codes</h1>
      <p className="text-xs text-slate-400 mb-6">
        Reference library of product groups and HS codes. The "Eurostat API" checkbox controls which codes are pulled when you use "Load from Eurostat" on a country's Trade Overview.
      </p>
      <HsCodesTable codes={codes ?? []} />
    </AppShell>
  );
}
