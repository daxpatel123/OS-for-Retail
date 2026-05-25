"use client";

import { ChevronRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { FlashReport } from "@/types";

const MOCK_REPORTS: FlashReport[] = [
  {
    id: "fr-1",
    storeId: "store-1",
    reportDate: "2026-05-25",
    totalSales: 22340.5,
    fuelSales: 14870.2,
    insideSales: 7470.3,
    lotterySales: 1820.0,
    tobaccoSales: 2410.5,
    cashSales: 8920.0,
    cardSales: 13420.5,
    grossProfit: 4088.31,
    grossMargin: 18.3,
    categories: [],
    parseConfidence: 97.4,
    status: "REVIEWED",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "fr-2",
    storeId: "store-1",
    reportDate: "2026-05-24",
    totalSales: 21890.0,
    fuelSales: 14520.0,
    insideSales: 7370.0,
    lotterySales: 1740.0,
    tobaccoSales: 2380.0,
    cashSales: 8710.0,
    cardSales: 13180.0,
    grossProfit: 3940.2,
    grossMargin: 18.0,
    categories: [],
    parseConfidence: 99.1,
    status: "REVIEWED",
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "fr-3",
    storeId: "store-1",
    reportDate: "2026-05-23",
    totalSales: 19200.0,
    fuelSales: 12800.0,
    insideSales: 6400.0,
    lotterySales: 1600.0,
    tobaccoSales: 2100.0,
    cashSales: 7680.0,
    cardSales: 11520.0,
    grossProfit: 3264.0,
    grossMargin: 17.0,
    categories: [],
    parseConfidence: 88.3,
    status: "PARSED",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "fr-4",
    storeId: "store-1",
    reportDate: "2026-05-22",
    totalSales: 23100.0,
    fuelSales: 15400.0,
    insideSales: 7700.0,
    lotterySales: 1920.0,
    tobaccoSales: 2510.0,
    cashSales: 9240.0,
    cardSales: 13860.0,
    grossProfit: 4389.0,
    grossMargin: 19.0,
    categories: [],
    parseConfidence: 95.8,
    status: "REVIEWED",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const statusConfig = {
  PENDING: { variant: "gray" as const, icon: Clock, label: "Pending" },
  PARSED: { variant: "warning" as const, icon: AlertCircle, label: "Needs Review" },
  REVIEWED: { variant: "success" as const, icon: CheckCircle2, label: "Reviewed" },
  ERROR: { variant: "destructive" as const, icon: AlertCircle, label: "Error" },
};

interface FlashReportListProps {
  data?: FlashReport[];
  isLoading?: boolean;
}

export function FlashReportList({ data, isLoading }: FlashReportListProps) {
  const reports = data ?? MOCK_REPORTS;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((report, index) => {
        const sc = statusConfig[report.status];
        const StatusIcon = sc.icon;
        const prevReport = reports[index + 1];
        const change = prevReport
          ? ((report.totalSales - prevReport.totalSales) / prevReport.totalSales) * 100
          : null;

        return (
          <div
            key={report.id}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
              <StatusIcon
                size={17}
                className={
                  sc.variant === "success"
                    ? "text-emerald-500"
                    : sc.variant === "warning"
                    ? "text-amber-500"
                    : "text-slate-400"
                }
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-800 text-sm">
                  {formatDate(report.reportDate, "EEE, MMM d yyyy")}
                </p>
                <Badge variant={sc.variant}>{sc.label}</Badge>
                {report.parseConfidence < 90 && (
                  <Badge variant="warning">
                    {report.parseConfidence.toFixed(0)}% conf.
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                <span>
                  Fuel: <strong className="text-slate-600">{formatCurrency(report.fuelSales)}</strong>
                </span>
                <span>
                  Inside:{" "}
                  <strong className="text-slate-600">
                    {formatCurrency(report.insideSales)}
                  </strong>
                </span>
                <span>
                  Margin:{" "}
                  <strong className="text-emerald-600">
                    {report.grossMargin.toFixed(1)}%
                  </strong>
                </span>
                {change !== null && (
                  <span className={change >= 0 ? "text-emerald-600" : "text-red-500"}>
                    {change >= 0 ? "+" : ""}
                    {change.toFixed(1)}% vs prior day
                  </span>
                )}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="font-bold text-slate-900 tabular-nums text-sm">
                {formatCurrency(report.totalSales)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">total sales</p>
            </div>

            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </div>
        );
      })}
    </div>
  );
}
