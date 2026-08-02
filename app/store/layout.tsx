import { createClient } from "@/lib/supabase/server";
import { getStoreAccess } from "@/lib/storeAccess";
import { redirect } from "next/navigation";
import StoreLogoutButton from "@/components/store/StoreLogoutButton";
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
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">{store?.name ?? "Store"}</div>
          <div className="text-xs text-slate-400">{format(new Date(), "EEEE, dd MMMM yyyy")}</div>
        </div>
        <StoreLogoutButton />
      </header>
      <main className="p-4 max-w-lg mx-auto pb-16">{children}</main>
    </div>
  );
}
