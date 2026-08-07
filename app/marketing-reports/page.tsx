import AppShell from "@/components/AppShell";
import { FileBarChart } from "lucide-react";

export default function MarketingReportsPage() {
  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Marketing Reports</h1>
      <div className="bg-white border border-slate-200 rounded-xl p-12 shadow-sm flex flex-col items-center text-center max-w-lg mx-auto mt-12">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <FileBarChart size={22} className="text-slate-400" />
        </div>
        <h2 className="font-medium mb-1">Coming soon</h2>
        <p className="text-sm text-slate-400">
          Reports on marketing activities — budget vs. results, by type and by country — will appear here once the Activities data has enough history behind it.
        </p>
      </div>
    </AppShell>
  );
}
