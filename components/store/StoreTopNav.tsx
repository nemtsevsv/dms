"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, BarChart3 } from "lucide-react";

const ITEMS = [
  { href: "/retail-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/store", label: "Daily Report", icon: ClipboardList },
  { href: "/retail-reports", label: "Reports", icon: BarChart3 },
];

export default function StoreTopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1 px-4 border-b border-slate-200 bg-white">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 -mb-px ${
              active ? "border-slate-900 text-slate-900 font-medium" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Icon size={15} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
