import { getStoreAccess } from "@/lib/storeAccess";
import { redirect } from "next/navigation";
import StoreShell from "@/components/store/StoreShell";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const access = await getStoreAccess();
  if (!access.isStoreStaff || !access.storeId) {
    // Not a recognized store login — send back to the regular admin app.
    redirect("/dashboard");
  }

  return <StoreShell storeId={access.storeId}>{children}</StoreShell>;
}
