"use client";

import { useState } from "react";
import { BarChart2, Upload } from "lucide-react";
import { FlashReportUploader } from "@/components/flash-reports/FlashReportUploader";
import { FlashReportList } from "@/components/flash-reports/FlashReportList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFlashReports } from "@/hooks/useInvoices";
import { cn } from "@/lib/utils";

type Tab = "list" | "upload";

export default function FlashReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const { data: reportsData, isLoading } = useFlashReports();

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Flash Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Upload and analyze your POS end-of-day reports
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setActiveTab("upload")}
        >
          <Upload size={14} />
          Upload Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Reports This Month", value: "25" },
          { label: "Avg Daily Sales", value: "$21,840" },
          { label: "Avg Gross Margin", value: "18.2%" },
          { label: "Needs Review", value: "1", highlight: true },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-lg border border-slate-100 px-4 py-3"
          >
            <p className="text-xs text-slate-400">{s.label}</p>
            <p
              className={`text-xl font-bold mt-0.5 ${
                s.highlight ? "text-amber-600" : "text-slate-900"
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {(
          [
            ["list", "Report History", BarChart2],
            ["upload", "Upload New", Upload],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
              activeTab === id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "list" ? "Flash Report History" : "Upload Flash Report"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {activeTab === "list" ? (
            <FlashReportList
              data={reportsData?.data}
              isLoading={isLoading}
            />
          ) : (
            <FlashReportUploader onSuccess={() => setActiveTab("list")} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
