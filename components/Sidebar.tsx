"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Store,
  ListTodo,
  Package,
  ShoppingCart,
  BarChart3,
  TrendingUp,
  FileBarChart,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import UserProfileCard from "./UserProfileCard";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/retail-dashboard", label: "Retail Dashboard", icon: TrendingUp },
  { href: "/retail-reports", label: "Retail Reports", icon: FileBarChart },
  { href: "/dealers", label: "Dealers", icon: Building2 },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const NavLinks = (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <UserProfileCard onNavigate={() => setOpen(false)} />
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo-capof.png" alt="CAPOF" className="h-6 w-auto shrink-0 brightness-0 invert opacity-90" />
          <img src="/logo-leica.png" alt="Leica" className="h-6 w-6 rounded-full shrink-0" />
          <span className="font-semibold text-sm truncate">Dealer Management System</span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="shrink-0">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-slate-900 text-slate-200 flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <span className="font-semibold text-white text-sm">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            {NavLinks}
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-slate-900 text-slate-200 min-h-screen flex-col">
        <div className="border-b border-slate-800">
          <img src="/logo-capof.png" alt="CAPOF" className="w-full h-auto px-5 pt-5 brightness-0 invert opacity-90" />
          <div className="flex items-center gap-2 px-5 pb-5 pt-3">
            <img src="/logo-leica.png" alt="Leica" className="w-7 h-7 rounded-full shrink-0" />
            <div className="font-semibold text-white text-sm leading-tight">
              Dealer Management
              <br />
              System
            </div>
          </div>
        </div>
        {NavLinks}
      </aside>
    </>
  );
}
