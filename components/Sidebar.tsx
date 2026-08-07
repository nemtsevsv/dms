"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Calendar,
  Megaphone,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const sections = [
  {
    label: "Dealers",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dealers", label: "Dealers", icon: Building2 },
      { href: "/orders", label: "Orders", icon: ShoppingCart },
      { href: "/tasks", label: "Tasks", icon: ListTodo },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Retail",
    items: [
      { href: "/retail-dashboard", label: "Retail Dashboard", icon: TrendingUp },
      { href: "/stores", label: "Stores", icon: Store },
      { href: "/retail-reports", label: "Retail Reports", icon: FileBarChart },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/marketing-dashboard", label: "Marketing Dashboard", icon: Calendar },
      { href: "/marketing-activities", label: "Activities", icon: Megaphone },
      { href: "/marketing-reports", label: "Marketing Reports", icon: FileBarChart },
    ],
  },
  {
    label: "",
    items: [{ href: "/products", label: "Products", icon: Package }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLinks = (
    <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3">
      {sections.map((section, si) => (
        <div key={si}>
          {section.label && (
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{section.label}</div>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm leading-tight transition-colors ${
                    active
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          {si < sections.length - 1 && <div className="border-t border-slate-800 mt-3" />}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/capof-badge.png" alt="CAPOF" className="h-6 w-auto shrink-0 brightness-0 invert opacity-90" />
          <img src="/leica-badge.png" alt="Leica" className="h-6 w-6 rounded-full shrink-0" />
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
      <aside className="hidden md:flex w-60 shrink-0 bg-slate-900 text-slate-200 h-screen sticky top-0 flex-col overflow-hidden">
        <div className="shrink-0 h-14 flex items-center gap-2.5 px-4 border-b border-slate-800">
          <img src="/leica-badge.png" alt="Leica" className="w-7 h-7 rounded-full shrink-0" />
          <span className="font-semibold text-white text-xs leading-tight whitespace-nowrap">Dealer Management System</span>
        </div>
        {NavLinks}
      </aside>
    </>
  );
}
