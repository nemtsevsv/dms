import AppShell from "@/components/AppShell";
import MarketingActivityForm from "@/components/MarketingActivityForm";

export default function NewMarketingActivityPage() {
  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">New Marketing Activity</h1>
      <MarketingActivityForm />
    </AppShell>
  );
}
