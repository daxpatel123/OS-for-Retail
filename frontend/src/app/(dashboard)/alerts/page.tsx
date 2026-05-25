"use client";

import { useState } from "react";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  Package,
  Fuel,
  FileText,
  TrendingDown,
  CheckCircle2,
  Clock,
  Filter,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Alert, AlertSeverity, AlertStatus } from "@/types";

const MOCK_ALERTS: Alert[] = [
  {
    id: "a1",
    storeId: "store-1",
    alertType: "FUEL_LOW",
    severity: "CRITICAL",
    status: "ACTIVE",
    title: "Fuel Tank Critical: Regular Unleaded",
    message:
      "Regular Unleaded at 18% capacity (2,160 gallons). At current sales velocity, you have approximately 28 hours remaining. Contact fuel supplier immediately for emergency delivery.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a2",
    storeId: "store-1",
    alertType: "OUT_OF_STOCK",
    severity: "CRITICAL",
    status: "ACTIVE",
    title: "Out of Stock: Newport 100s Box",
    message:
      "Newport 100s Box is fully depleted. This is a high-velocity tobacco item with ~98 units/week average sales. Revenue impact: ~$950/week if not restocked.",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a3",
    storeId: "store-1",
    alertType: "LOW_STOCK",
    severity: "WARNING",
    status: "ACTIVE",
    title: "Low Stock: Marlboro Red 20pk",
    message:
      "Only 12 units remaining (below reorder point of 20). At current sell rate of ~6 units/day, you have approximately 2 days of supply.",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a4",
    storeId: "store-1",
    alertType: "INVOICE_DUE",
    severity: "WARNING",
    status: "ACTIVE",
    title: "Invoice Due: McLane Company",
    message:
      "Invoice #MC-29841 for $4,218.50 is due in 2 days (May 31). Review and approve to avoid late fees.",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a5",
    storeId: "store-1",
    alertType: "SALES_DROP",
    severity: "INFO",
    status: "ACTIVE",
    title: "Sales Drop Detected — Beverages",
    message:
      "Beverage category sales are down 18% compared to the same time yesterday. Celsius and Prime Hydration showing lowest movement. Consider promotional placement.",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a6",
    storeId: "store-1",
    alertType: "SHRINK_DETECTED",
    severity: "WARNING",
    status: "ACKNOWLEDGED",
    title: "Potential Shrink Detected",
    message:
      "Inventory adjustment shows 8 units of 5-Hour Energy Berry unaccounted for since last count. Possible theft or receiving error. Review security footage.",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a7",
    storeId: "store-1",
    alertType: "LOW_STOCK",
    severity: "WARNING",
    status: "RESOLVED",
    title: "Low Stock Resolved: Monster Zero Ultra",
    message: "Monster Zero Ultra has been restocked. 96 units added.",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
];

const alertTypeIcons: Record<string, React.ElementType> = {
  LOW_STOCK: Package,
  OUT_OF_STOCK: Package,
  PRICE_ANOMALY: AlertTriangle,
  SALES_DROP: TrendingDown,
  INVOICE_DUE: FileText,
  FUEL_LOW: Fuel,
  SHRINK_DETECTED: AlertCircle,
  SYSTEM: Info,
};

const severityConfig: Record<
  AlertSeverity,
  {
    variant: "destructive" | "warning" | "info";
    iconColor: string;
    bg: string;
    border: string;
  }
> = {
  CRITICAL: {
    variant: "destructive",
    iconColor: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  WARNING: {
    variant: "warning",
    iconColor: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  INFO: {
    variant: "info",
    iconColor: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
};

export default function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState<"ALL" | AlertStatus>("ALL");
  const [severityFilter, setSeverityFilter] = useState<
    "ALL" | AlertSeverity
  >("ALL");

  const filtered = MOCK_ALERTS.filter((a) => {
    const ms = statusFilter === "ALL" || a.status === statusFilter;
    const msev = severityFilter === "ALL" || a.severity === severityFilter;
    return ms && msev;
  });

  const counts = {
    active: MOCK_ALERTS.filter((a) => a.status === "ACTIVE").length,
    critical: MOCK_ALERTS.filter(
      (a) => a.severity === "CRITICAL" && a.status === "ACTIVE"
    ).length,
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Alerts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time store alerts and notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          {counts.active > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg text-xs font-semibold text-red-600">
              <AlertCircle size={13} />
              {counts.active} active alerts
            </span>
          )}
          <Button variant="outline" size="sm" className="gap-1.5">
            <Check size={14} />
            Acknowledge All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Active",
            value: MOCK_ALERTS.filter((a) => a.status === "ACTIVE").length,
            color: "text-red-600",
          },
          {
            label: "Critical",
            value: MOCK_ALERTS.filter((a) => a.severity === "CRITICAL").length,
            color: "text-red-600",
          },
          {
            label: "Acknowledged",
            value: MOCK_ALERTS.filter((a) => a.status === "ACKNOWLEDGED").length,
            color: "text-amber-600",
          },
          {
            label: "Resolved Today",
            value: MOCK_ALERTS.filter((a) => a.status === "RESOLVED").length,
            color: "text-emerald-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-lg border border-slate-100 px-4 py-3"
          >
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Filter size={14} />
          Status:
        </div>
        {(["ALL", "ACTIVE", "ACKNOWLEDGED", "RESOLVED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
              statusFilter === s
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            )}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}

        <div className="flex items-center gap-1.5 text-sm text-slate-500 ml-4">
          Severity:
        </div>
        {(["ALL", "CRITICAL", "WARNING", "INFO"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
              severityFilter === s
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            )}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-slate-700 font-medium">All clear!</p>
            <p className="text-sm text-slate-400 mt-1">
              No alerts match your filters.
            </p>
          </div>
        ) : (
          filtered.map((alert) => {
            const Icon = alertTypeIcons[alert.alertType] ?? Bell;
            const config = severityConfig[alert.severity];

            return (
              <div
                key={alert.id}
                className={cn(
                  "p-4 rounded-xl border transition-all hover:shadow-sm",
                  alert.status === "RESOLVED"
                    ? "bg-white border-slate-100 opacity-60"
                    : `${config.bg} ${config.border}`
                )}
              >
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <Icon size={17} className={config.iconColor} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 text-sm">
                        {alert.title}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={config.variant}>
                          {alert.severity}
                        </Badge>
                        {alert.status === "ACKNOWLEDGED" && (
                          <Badge variant="gray">Acknowledged</Badge>
                        )}
                        {alert.status === "RESOLVED" && (
                          <Badge variant="success">Resolved</Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatDateTime(alert.createdAt)}
                      </span>
                      {alert.acknowledgedAt && (
                        <span className="text-amber-600">
                          Acknowledged {formatDateTime(alert.acknowledgedAt)}
                        </span>
                      )}
                      {alert.resolvedAt && (
                        <span className="text-emerald-600">
                          Resolved {formatDateTime(alert.resolvedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {alert.status === "ACTIVE" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm">
                        Acknowledge
                      </Button>
                      <Button variant="ghost" size="sm">
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
