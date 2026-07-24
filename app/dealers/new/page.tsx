import AppShell from "@/components/AppShell";
import DealerForm from "@/components/DealerForm";

export default function NewDealerPage() {
  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">Новый дилер</h1>
      <DealerForm />
    </AppShell>
  );
}
