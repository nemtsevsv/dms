import AppShell from "@/components/AppShell";
import ProfileForm from "@/components/ProfileForm";

export default function ProfilePage() {
  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-6">My Profile</h1>
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <ProfileForm />
      </div>
    </AppShell>
  );
}
