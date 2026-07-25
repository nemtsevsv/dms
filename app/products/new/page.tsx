import AppShell from "@/components/AppShell";
import ProductForm from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">New Product</h1>
      <ProductForm />
    </AppShell>
  );
}
