"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlashReportList } from "@/components/flash-reports/FlashReportList";
import { FlashReportUploader } from "@/components/flash-reports/FlashReportUploader";
import type { FlashReport } from "@/types";

const mockReports: FlashReport[] = [
  {
    id: "fr1",
    storeId: "s1",
    reportDate: "2026-05-30",
    parseStatus: "COMPLETED",
    parseConfidence: 0.97,
    totalSales: 22400,
    fuelSalesAmount: 15100,
    fuelGallons: 4210,
    insideSales: 7300,
    lotterySales: 1240,
    tobaccoSales: 1880,
    taxCollected: 620,
    cashSales: 6800,
    cardSales: 15600,
    refunds: 84,
    voids: 12,
    transactionCount: 312,
    createdAt: "2026-05-30T07:00:00Z",
  },
  {
    id: "fr2",
    storeId: "s1",
    reportDate: "2026-05-29",
    parseStatus: "COMPLETED",
    parseConfidence: 0.99,
    totalSales: 24900,
    fuelSalesAmount: 17200,
    fuelGallons: 4800,
    insideSales: 7700,
    lotterySales: 1380,
    tobaccoSales: 2020,
    taxCollected: 680,
    cashSales: 7200,
    cardSales: 17700,
    refunds: 62,
    voids: 8,
    transactionCount: 341,
    createdAt: "2026-05-29T07:05:00Z",
  },
  {
    id: "fr3",
    storeId: "s1",
    reportDate: "2026-05-28",
    parseStatus: "COMPLETED",
    parseConfidence: 0.95,
    totalSales: 17600,
    fuelSalesAmount: 11800,
    fuelGallons: 3290,
    insideSales: 5800,
    lotterySales: 920,
    tobaccoSales: 1540,
    taxCollected: 480,
    cashSales: 5200,
    cardSales: 12400,
    refunds: 45,
    voids: 5,
    transactionCount: 248,
    createdAt: "2026-05-28T07:10:00Z",
  },
];

export default function FlashReportsPage() {
  const [showUploader, setShowUploader] = useState(false);

  const latest = mockReports[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{mockReports.length} reports</p>
        <Button onClick={() => setShowUploader((v) => !v)}>
          <Plus size={16} />
          Upload Report
        </Button>
      </div>

      {showUploader && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Flash Report</CardTitle>
          </CardHeader>
          <CardContent>
            <FlashReportUploader />
          </CardContent>
        </Card>
      )}

      {/* Latest metrics */}
      {latest.parseStatus === "COMPLETED" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Sales", value: `$${(latest.totalSales ?? 0).toLocaleString()}` },
            { label: "Fuel Sales", value: `$${(latest.fuelSalesAmount ?? 0).toLocaleString()}` },
            { label: "Inside Sales", value: `$${(latest.insideSales ?? 0).toLocaleString()}` },
            { label: "Transactions", value: String(latest.transactionCount ?? 0) },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Flash Report History</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <FlashReportList reports={mockReports} />
        </CardContent>
      </Card>
    </div>
  );
}
