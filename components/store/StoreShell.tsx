import { createClient } from "@/lib/supabase/server";
import StoreLogoutButton from "./StoreLogoutButton";
import StoreTopNav from "./StoreTopNav";
import StoreBottomNav from "./StoreBottomNav";
import { format } from "date-fns";

export default async function StoreShell({ storeId, children }: { storeId: string; children: React.ReactNode }) {
  const supabase = createClient();
  const { data: store } = await supabase.from("stores").select("name, currency").eq("id", storeId).single();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{store?.name ?? "Store"}</div>
          <div className="text-xs text-slate-400">{format(new Date(), "EEEE, dd MMMM yyyy")}</div>
        </div>
        <StoreLogoutButton />
      </header>
      <StoreTopNav />
      <main className="p-4 max-w-lg md:max-w-3xl mx-auto pb-20 md:pb-8">{children}</main>
      <StoreBottomNav />
    </div>
  );
}
