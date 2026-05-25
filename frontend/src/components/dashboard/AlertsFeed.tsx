"use client";

import {
  AlertTriangle,
  AlertCircle,
  Info,
  Package,
  Fuel,
  FileText,
  TrendingDown,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Alert } from "@/types";

const MOCK_ALERTS: Alert[] = [
  {
    id: "a1",
    storeId: "store-1",
    alertType: "LOW_STOCK",
    severity: "WARNING",
    status: "ACTIVE",
    title: "Low Stock: Marlboro Red 20pk",
    message:
      "Only 12 units remaining. Below reorder point of 20. Consider placing order with McLane.",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "a2",
    storeId: "store-1",
    alertType: "FUEL_LOW",
    severity: "CRITICAL",
    status: "ACTIVE",
    title: "Fuel Tank Critical: Regular Unleaded",
    message:
      "Regular Unleaded at 18% capacity (2,160 gal). Contact fuel supplier for emergency delivery.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a3",
    storeId: "store-1",
    alertType: "INVOICE_DUE",
    severity: "WARNING",
    status: "ACTIVE",
    title: "Invoice Due: McLane Company",
    message: "Invoice #MC-29841 for $4,218.50 is due in 2 days.",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a4",
    storeId: "store-1",
    alertType: "SALES_DROP",
    severity: "INFO",
    status: "ACTIVE",
    title: "Sales Drop Detected",
    message:
      "Inside sales down 12% vs same time yesterday. Beverages category most impacted.",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "a5",
    storeId: "store-1",
    alertType: "OUT_OF_STOCK",
    severity: "CRITICAL",
    status: "ACKNOWLEDGED",
    title: "Out of Stock: Prime Hydration Blue",
    message: "Item is fully depleted. High demand product — 15 units requested.",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
  },
];

const alertTypeIcons = {
  LOW_STOCK: Package,
  OUT_OF_STOCK: Package,
  PRICE_ANOMALY: AlertTriangle,
  SALES_DROP: TrendingDown,
  INVOICE_DUE: FileText,
  FUEL_LOW: Fuel,
  SHRINK_DETECTED: AlertCircle,
  SYSTEM: Info,
};

const severityConfig = {
  CRITICAL: {
    badge: "destructive" as const,
    iconColor: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  WARNING: {
    badge: "warning" as const,
    iconColor: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  INFO: {
    badge: "info" as const,
    iconColor: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
};

interface AlertsFeedProps {
  data?: Alert[];
  isLoading?: boolean;
}

export function AlertsFeed({ data, isLoading }: AlertsFeedProps) {
  const alerts = data ?? MOCK_ALERTS;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700">All clear!</p>
        <p className="text-xs text-slate-400 mt-0.5">No active alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {alerts.map((alert) => {
        const Icon = alertTypeIcons[alert.alertType] ?? AlertCircle;
        const config = severityConfig[alert.severity];

        return (
          <div
            key={alert.id}
            className={`flex gap-3 p-3.5 rounded-xl border ${config.bg} ${config.border} hover:shadow-sm transition-shadow cursor-pointer`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm`}
            >
              <Icon size={16} className={config.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-0.5">
                <p className="text-sm font-semibold text-slate-800 leading-tight">
                  {alert.title}
                </p>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge variant={config.badge}>{alert.severity}</Badge>
                  {alert.status === "ACKNOWLEDGED" && (
                    <Badge variant="gray">ACK</Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-1.5">
                {alert.message}
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={11} />
                <span>{formatDateTime(alert.createdAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
