import AppShell from "@/components/AppShell";
import StoreForm from "@/components/StoreForm";

export default function NewStorePage() {
  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">New Store</h1>
      <StoreForm />
    </AppShell>
  );
}
