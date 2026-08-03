import { createClient } from "@/lib/supabase/server";
import { getStoreAccess } from "@/lib/storeAccess";
import { redirect } from "next/navigation";
import StoreLogoutButton from "@/components/store/StoreLogoutButton";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { format } from "date-fns";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const access = await getStoreAccess();
  if (!access.isStoreStaff || !access.storeId) {
    // Not a recognized store login — send back to the regular admin app.
    redirect("/dashboard");
  }

  const supabase = createClient();
  const { data: store } = await supabase.from("stores").select("name, currency").eq("id", access.storeId).single();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/store" className="min-w-0">
          <div className="font-semibold text-sm truncate">{store?.name ?? "Store"}</div>
          <div className="text-xs text-slate-400">{format(new Date(), "EEEE, dd MMMM yyyy")}</div>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/store"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium"
          >
            <ClipboardList size={14} />
            Today's Report
          </Link>
          <StoreLogoutButton />
        </div>
      </header>
      <main className="p-4 max-w-lg mx-auto pb-16">{children}</main>
    </div>
  );
}
