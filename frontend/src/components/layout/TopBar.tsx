"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inventory": "Inventory",
  "/invoices": "Invoices",
  "/flash-reports": "Flash Reports",
  "/fuel": "Fuel Management",
  "/alerts": "Alerts",
  "/assistant": "AI Assistant",
};

export function TopBar() {
  const pathname = usePathname();

  const title =
    Object.entries(pageTitles).find(([key]) =>
      pathname === key || pathname.startsWith(key + "/")
    )?.[1] ?? "RetailOS";

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <div className="flex items-center gap-3">
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-white text-sm font-semibold">A</span>
        </div>
      </div>
    </header>
  );
}
