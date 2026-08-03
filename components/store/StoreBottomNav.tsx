"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, BarChart3 } from "lucide-react";

const ITEMS = [
  { href: "/retail-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/store", label: "Daily Report", icon: ClipboardList },
  { href: "/retail-reports", label: "Reports", icon: BarChart3 },
];

export default function StoreBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 flex md:hidden">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs ${active ? "text-slate-900 font-medium" : "text-slate-400"}`}
          >
            <Icon size={20} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
