import { createClient } from "@/lib/supabase/server";
import { getStoreAccess } from "@/lib/storeAccess";
import { getStoreDate } from "@/lib/storeTimezone";
import StoreLogoutButton from "./StoreLogoutButton";
import StoreTopNav from "./StoreTopNav";
import StoreBottomNav from "./StoreBottomNav";
import { format } from "date-fns";

const ROLE_LABELS: Record<string, string> = {
  seller: "Seller",
  store_manager: "Store Manager",
};

export default async function StoreShell({ storeId, wide, children }: { storeId: string; wide?: boolean; children: React.ReactNode }) {
  const supabase = createClient();
  const access = await getStoreAccess();
  const [{ data: store }, { data: me }] = await Promise.all([
    supabase.from("stores").select("name, currency, timezone").eq("id", storeId).single(),
    access.email ? supabase.from("store_users").select("display_name, role").eq("store_id", storeId).eq("email", access.email).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const todayLabel = format(getStoreDate(store?.timezone || "Asia/Almaty"), "dd.MM.yyyy");
  const myDisplayName = me?.display_name || access.email || "";
  const myRoleLabel = me?.role ? ROLE_LABELS[me.role] ?? me.role : "";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo-leica.png" alt="Leica" className="h-7 w-7 rounded-full shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{store?.name ?? "Store"}</div>
            <div className="text-xs text-slate-400">{todayLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {myDisplayName && (
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium truncate max-w-[160px]">{myDisplayName}</div>
              {myRoleLabel && <div className="text-xs text-slate-400">{myRoleLabel}</div>}
            </div>
          )}
          <StoreLogoutButton />
        </div>
      </header>
      <StoreTopNav />
      <main className={`p-4 mx-auto pb-20 md:pb-8 ${wide ? "max-w-lg md:max-w-6xl" : "max-w-lg md:max-w-3xl"}`}>{children}</main>
      <StoreBottomNav />
    </div>
  );
}
