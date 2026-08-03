import Sidebar from "./Sidebar";
import { getStoreAccess } from "@/lib/storeAccess";
import { redirect } from "next/navigation";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  // Defense in depth: middleware already redirects store staff away from
  // every admin route, but this guarantees the admin sidebar and its pages
  // (including "New Store") can never render for a store-staff session,
  // even in an edge case middleware doesn't catch.
  const access = await getStoreAccess();
  if (access.isStoreStaff) {
    redirect("/store");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 max-w-[1400px] overflow-x-hidden">{children}</main>
    </div>
  );
}
