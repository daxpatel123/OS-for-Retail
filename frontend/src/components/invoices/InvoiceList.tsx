"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Search,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types";
import { cn } from "@/lib/utils";

const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv-1",
    storeId: "store-1",
    vendor: {
      id: "v1",
      organizationId: "org-1",
      name: "McLane Company",
    },
    invoiceNumber: "MC-29841",
    invoiceDate: "2026-05-24",
    dueDate: "2026-05-31",
    status: "EXTRACTED",
    totalAmount: 4218.5,
    lineItems: [],
    ocrConfidence: 94.2,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "inv-2",
    storeId: "store-1",
    vendor: {
      id: "v2",
      organizationId: "org-1",
      name: "Core-Mark International",
    },
    invoiceNumber: "CM-58291",
    invoiceDate: "2026-05-23",
    dueDate: "2026-05-30",
    status: "APPROVED",
    totalAmount: 2847.0,
    lineItems: [],
    ocrConfidence: 98.1,
    approvedBy: "John Smith",
    approvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "inv-3",
    storeId: "store-1",
    vendor: {
      id: "v3",
      organizationId: "org-1",
      name: "Altria Client Services",
    },
    invoiceNumber: "ACS-10482",
    invoiceDate: "2026-05-22",
    dueDate: "2026-05-29",
    status: "POSTED",
    totalAmount: 5621.4,
    lineItems: [],
    ocrConfidence: 96.8,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "inv-4",
    storeId: "store-1",
    vendor: {
      id: "v1",
      organizationId: "org-1",
      name: "McLane Company",
    },
    invoiceNumber: "MC-29712",
    invoiceDate: "2026-05-21",
    dueDate: "2026-05-28",
    status: "PROCESSING",
    totalAmount: 3104.75,
    lineItems: [],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "inv-5",
    storeId: "store-1",
    vendor: {
      id: "v4",
      organizationId: "org-1",
      name: "Keurig Dr Pepper",
    },
    invoiceNumber: "KDP-84201",
    invoiceDate: "2026-05-20",
    status: "ERROR",
    totalAmount: 892.5,
    lineItems: [],
    notes: "Failed to parse — low quality scan. Please re-upload.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const statusConfig: Record<
  InvoiceStatus,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "gray" | "info" | "default";
    icon: React.ElementType;
  }
> = {
  PENDING: {
    label: "Pending",
    variant: "gray",
    icon: Clock,
  },
  PROCESSING: {
    label: "Processing",
    variant: "info",
    icon: Loader2,
  },
  EXTRACTED: {
    label: "Needs Review",
    variant: "warning",
    icon: AlertCircle,
  },
  REVIEWED: {
    label: "Reviewed",
    variant: "default",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    variant: "success",
    icon: CheckCircle2,
  },
  POSTED: {
    label: "Posted",
    variant: "success",
    icon: CheckCircle2,
  },
  ERROR: {
    label: "Error",
    variant: "destructive",
    icon: AlertCircle,
  },
};

interface InvoiceListProps {
  data?: Invoice[];
  isLoading?: boolean;
  onSelect?: (invoice: Invoice) => void;
}

export function InvoiceList({ data, isLoading, onSelect }: InvoiceListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | InvoiceStatus>(
    "ALL"
  );

  const invoices = data ?? MOCK_INVOICES;

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      !search ||
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.vendor?.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by invoice # or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "ALL" | InvoiceStatus)
          }
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Status</option>
          {Object.keys(statusConfig).map((s) => (
            <option key={s} value={s}>
              {statusConfig[s as InvoiceStatus].label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-slate-100 rounded-xl animate-pulse"
            />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No invoices found.
          </div>
        ) : (
          filtered.map((invoice) => {
            const sc = statusConfig[invoice.status];
            const StatusIcon = sc.icon;
            return (
              <div
                key={invoice.id}
                onClick={() => onSelect?.(invoice)}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-sm hover:border-slate-200 transition-all cursor-pointer"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    invoice.status === "ERROR"
                      ? "bg-red-50"
                      : invoice.status === "EXTRACTED"
                      ? "bg-amber-50"
                      : invoice.status === "APPROVED" ||
                        invoice.status === "POSTED"
                      ? "bg-emerald-50"
                      : "bg-slate-50"
                  )}
                >
                  <StatusIcon
                    size={16}
                    className={cn(
                      invoice.status === "PROCESSING" && "animate-spin",
                      invoice.status === "ERROR"
                        ? "text-red-500"
                        : invoice.status === "EXTRACTED"
                        ? "text-amber-500"
                        : invoice.status === "APPROVED" ||
                          invoice.status === "POSTED"
                        ? "text-emerald-500"
                        : "text-slate-400"
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 text-sm">
                      {invoice.vendor?.name ?? "Unknown vendor"}
                    </p>
                    <Badge variant={sc.variant}>{sc.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                    <span>#{invoice.invoiceNumber}</span>
                    {invoice.invoiceDate && (
                      <span>{formatDate(invoice.invoiceDate)}</span>
                    )}
                    {invoice.dueDate && (
                      <span>Due {formatDate(invoice.dueDate)}</span>
                    )}
                    {invoice.ocrConfidence && (
                      <span>OCR: {invoice.ocrConfidence.toFixed(0)}%</span>
                    )}
                  </div>
                  {invoice.notes && (
                    <p className="text-xs text-red-500 mt-1 truncate">
                      {invoice.notes}
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-900 tabular-nums">
                    {formatCurrency(invoice.totalAmount)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDate(invoice.createdAt, "MMM d")}
                  </p>
                </div>

                <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
