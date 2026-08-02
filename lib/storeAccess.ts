import { createClient } from "@/lib/supabase/server";

export type StoreAccess = { isStoreStaff: boolean; storeId: string | null; storeRole: string | null; email: string | null };

export async function getStoreAccess(): Promise<StoreAccess> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { isStoreStaff: false, storeId: null, storeRole: null, email: null };

  const { data } = await supabase.from("store_users").select("store_id, role").eq("email", user.email).maybeSingle();
  if (!data) return { isStoreStaff: false, storeId: null, storeRole: null, email: user.email };
  return { isStoreStaff: true, storeId: data.store_id, storeRole: data.role, email: user.email };
}
