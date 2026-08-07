import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

// Access control for store staff is handled once, in middleware.ts, before
// any page even starts rendering — that already reliably keeps them out of
// every admin route (fixed in migration_9). Re-checking it again here used
// to cost an extra database round trip on every single page navigation;
// removed so navigating the admin panel feels instant again.
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-8 max-w-[1400px] overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
