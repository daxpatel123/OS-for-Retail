"use client";

import { useState } from "react";
import type { ElementType } from "react";
import { AlertTriangle, Bell, CheckCircle, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateTime } from "@/lib/utils";
import type { Alert, AlertStatus } from "@/types";

const mockAlerts: Alert[] = [
  {
    id: "a1",
    orgId: "org1",
    storeId: "s1",
    alertType: "LOW_STOCK",
    severity: "HIGH",
    title: "Red Bull 8.4oz Low Stock",
    message: "Only 8 units remaining. Reorder point is 24 units.",
    status: "OPEN",
    createdAt: "2026-05-30T08:15:00Z",
  },
  {
    id: "a2",
    orgId: "org1",
    storeId: "s1",
    alertType: "INVOICE_DISCREPANCY",
    severity: "MEDIUM",
    title: "Invoice #INV-2248 Discrepancy",
    message: "Line item quantity mismatch detected on McLane delivery. 3 items differ.",
    status: "OPEN",
    createdAt: "2026-05-30T07:42:00Z",
  },
  {
    id: "a3",
    orgId: "org1",
    storeId: "s1",
    alertType: "CASH_SHORT",
    severity: "HIGH",
    title: "Cash Drawer Short $47.20",
    message: "End-of-day cash count does not match POS total for 5/29 closing.",
    status: "ACKNOWLEDGED",
    createdAt: "2026-05-29T23:05:00Z",
  },
  {
    id: "a4",
    orgId: "org1",
    storeId: "s1",
    alertType: "LOW_STOCK",
    severity: "CRITICAL",
    title: "Marlboro Red King Out of Stock",
    message: "Item is completely out of stock. Immediate reorder required.",
    status: "OPEN",
    createdAt: "2026-05-29T22:00:00Z",
  },
  {
    id: "a5",
    orgId: "org1",
    storeId: "s1",
    alertType: "FUEL_LOW",
    severity: "LOW",
    title: "Mid-Grade Tank at 51%",
    message: "Mid-grade fuel tank is at 51% capacity. Schedule delivery.",
    status: "RESOLVED",
    createdAt: "2026-05-28T14:30:00Z",
  },
  {
    id: "a6",
    orgId: "org1",
    storeId: "s1",
    alertType: "PRICE_MARGIN_EROSION",
    severity: "MEDIUM",
    title: "Margin Alert: Energy Drinks",
    message: "Energy drink category margin dropped below 25% target.",
    status: "ACKNOWLEDGED",
    createdAt: "2026-05-28T10:00:00Z",
  },
];

const severityVariant: Record<Alert["severity"], "danger" | "warning" | "info" | "gray"> = {
  CRITICAL: "danger",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "gray",
};

const statusFilters: { id: AlertStatus | "ALL"; label: string; icon: ElementType }[] = [
  { id: "ALL", label: "All", icon: Bell },
  { id: "OPEN", label: "Open", icon: AlertTriangle },
  { id: "ACKNOWLEDGED", label: "Acknowledged", icon: Clock },
  { id: "RESOLVED", label: "Resolved", icon: CheckCircle },
];

export default function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "ALL">("ALL");

  const filtered =
    statusFilter === "ALL"
      ? mockAlerts
      : mockAlerts.filter((a) => a.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setStatusFilter(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
              statusFilter === id
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <Icon size={14} />
            {label}
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-xs",
                statusFilter === id ? "bg-blue-500" : "bg-slate-100 text-slate-500"
              )}
            >
              {id === "ALL"
                ? mockAlerts.length
                : mockAlerts.filter((a) => a.status === id).length}
            </span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter === "ALL" ? "All Alerts" : `${statusFilter} Alerts`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No alerts in this category
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {filtered.map((alert) => (
                <li key={alert.id} className="flex items-start gap-4 px-6 py-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <Badge variant={severityVariant[alert.severity]}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {alert.title}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">{alert.message}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDateTime(alert.createdAt)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge
                      variant={
                        alert.status === "RESOLVED"
                          ? "success"
                          : alert.status === "ACKNOWLEDGED"
                          ? "info"
                          : "warning"
                      }
                    >
                      {alert.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
