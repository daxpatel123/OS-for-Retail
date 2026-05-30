import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: ReactNode;
  color: string;
}

export function KPICard({ title, value, change, icon, color }: KPICardProps) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <div className="mt-2 flex items-center gap-1">
            <span
              className={cn(
                "text-sm font-medium",
                isPositive ? "text-emerald-600" : "text-red-500"
              )}
            >
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">vs yesterday</span>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-11 h-11 rounded-xl",
            color
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
