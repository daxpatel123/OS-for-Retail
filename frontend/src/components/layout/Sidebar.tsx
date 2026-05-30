"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FileText,
  BarChart2,
  Droplets,
  Bell,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/flash-reports", label: "Flash Reports", icon: BarChart2 },
  { href: "/fuel", label: "Fuel", icon: Droplets },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-screen w-60 bg-slate-900 text-white flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-700">
        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">R</span>
        </div>
        <span className="text-lg font-bold tracking-tight">RetailOS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">RetailOS v0.1.0</p>
      </div>
    </aside>
  );
}
