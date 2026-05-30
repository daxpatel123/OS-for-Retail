import type { Alert } from "@/types";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";

interface AlertsFeedProps {
  alerts: Alert[];
}

const severityDot: Record<Alert["severity"], string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-amber-400",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-500",
};

export function AlertsFeed({ alerts }: AlertsFeedProps) {
  if (alerts.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        No active alerts
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-50">
      {alerts.map((alert) => (
        <li key={alert.id} className="flex items-start gap-3 py-3 px-4">
          <span
            className={cn(
              "mt-1.5 flex-shrink-0 w-2 h-2 rounded-full",
              severityDot[alert.severity]
            )}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {alert.title}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
              {alert.message}
            </p>
          </div>
          <span className="flex-shrink-0 text-xs text-slate-400">
            {formatDateTime(alert.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
