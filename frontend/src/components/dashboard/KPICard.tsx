import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  isLoading?: boolean;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  iconBg,
  isLoading = false,
}: KPICardProps) {
  const isPositive = change >= 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="h-4 bg-slate-100 rounded w-24 animate-pulse" />
          <div className="w-10 h-10 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-8 bg-slate-100 rounded w-32 animate-pulse mb-2" />
        <div className="h-4 bg-slate-100 rounded w-20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>

      <p className="text-2xl font-bold text-slate-900 mb-1.5">{value}</p>

      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            "flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5",
            isPositive
              ? "text-emerald-700 bg-emerald-50"
              : "text-red-600 bg-red-50"
          )}
        >
          {isPositive ? (
            <TrendingUp size={11} />
          ) : (
            <TrendingDown size={11} />
          )}
          {isPositive ? "+" : ""}
          {change.toFixed(1)}%
        </div>
        <span className="text-xs text-slate-400">
          {changeLabel ?? "vs yesterday"}
        </span>
      </div>
    </div>
  );
}
