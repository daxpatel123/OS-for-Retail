"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  X,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { FlashReport } from "@/types";

const MOCK_PARSED: FlashReport = {
  id: "fr-new",
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
  categories: [
    { name: "Tobacco", sales: 2410.5, transactions: 142 },
    { name: "Beverages", sales: 1980.2, transactions: 381 },
    { name: "Snacks", sales: 1240.8, transactions: 298 },
    { name: "Lottery", sales: 1820.0, transactions: 340 },
    { name: "Other", sales: 18.8, transactions: 51 },
  ],
  parseConfidence: 97.4,
  status: "PARSED",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

type UploadState = "idle" | "uploading" | "processing" | "done" | "error";

interface FlashReportUploaderProps {
  onSuccess?: () => void;
}

export function FlashReportUploader({ onSuccess }: FlashReportUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [parsed, setParsed] = useState<FlashReport | null>(null);

  const simulateUpload = useCallback(async () => {
    setUploadState("uploading");
    setProgress(0);

    for (let i = 0; i <= 100; i += 20) {
      await new Promise((r) => setTimeout(r, 100));
      setProgress(i);
    }

    setUploadState("processing");
    await new Promise((r) => setTimeout(r, 1800));
    setParsed(MOCK_PARSED);
    setUploadState("done");
    onSuccess?.();
  }, [onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && simulateUpload(),
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
    disabled: uploadState !== "idle",
  });

  const reset = () => {
    setUploadState("idle");
    setProgress(0);
    setParsed(null);
  };

  const confidenceColor =
    (parsed?.parseConfidence ?? 0) >= 95
      ? "text-emerald-600"
      : (parsed?.parseConfidence ?? 0) >= 80
      ? "text-amber-600"
      : "text-red-600";

  return (
    <div className="space-y-5">
      {uploadState === "idle" && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
            isDragActive
              ? "border-blue-400 bg-blue-50"
              : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Upload size={22} className="text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">
                Upload Flash Report
              </p>
              <p className="text-sm text-slate-400 mt-1">
                POS end-of-day report — PDF, CSV, XLSX, or image
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadState === "uploading" && (
        <div className="p-5 bg-white rounded-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <FileText size={18} className="text-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">
                Uploading report...
              </p>
            </div>
            <span className="text-sm font-semibold text-blue-600">
              {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {uploadState === "processing" && (
        <div className="p-5 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-4">
          <Loader2 size={22} className="text-blue-500 animate-spin" />
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Parsing Flash Report...
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              Extracting totals, categories, payment splits, fuel data
            </p>
          </div>
        </div>
      )}

      {uploadState === "done" && parsed && (
        <div className="space-y-4 animate-fade-in">
          {/* Success header */}
          <div className="flex items-start justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Flash report parsed
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Confidence:{" "}
                  <strong className={confidenceColor}>
                    {parsed.parseConfidence.toFixed(1)}%
                  </strong>{" "}
                  &bull; {parsed.reportDate}
                </p>
              </div>
            </div>
            <button onClick={reset} className="p-1 text-emerald-400 hover:text-emerald-600">
              <X size={16} />
            </button>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              {
                label: "Total Sales",
                value: formatCurrency(parsed.totalSales),
                icon: TrendingUp,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Fuel Sales",
                value: formatCurrency(parsed.fuelSales),
                icon: TrendingUp,
                color: "text-orange-600",
                bg: "bg-orange-50",
              },
              {
                label: "Inside Sales",
                value: formatCurrency(parsed.insideSales),
                icon: TrendingUp,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                label: "Gross Profit",
                value: formatCurrency(parsed.grossProfit),
                icon: TrendingUp,
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                label: "Lottery",
                value: formatCurrency(parsed.lotterySales),
                icon: TrendingDown,
                color: "text-indigo-600",
                bg: "bg-indigo-50",
              },
              {
                label: "Tobacco",
                value: formatCurrency(parsed.tobaccoSales),
                icon: TrendingUp,
                color: "text-slate-600",
                bg: "bg-slate-50",
              },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="bg-white rounded-lg border border-slate-100 p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-500">{m.label}</p>
                    <div className={`w-6 h-6 rounded ${m.bg} flex items-center justify-center`}>
                      <Icon size={12} className={m.color} />
                    </div>
                  </div>
                  <p className={`text-base font-bold ${m.color}`}>{m.value}</p>
                </div>
              );
            })}
          </div>

          {/* Payment split */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-800 mb-3">
              Payment Method Split
            </p>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Cash</span>
                  <span>
                    {((parsed.cashSales / parsed.totalSales) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${(parsed.cashSales / parsed.totalSales) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs font-medium text-slate-700 mt-1">
                  {formatCurrency(parsed.cashSales)}
                </p>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Card</span>
                  <span>
                    {((parsed.cardSales / parsed.totalSales) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${(parsed.cardSales / parsed.totalSales) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs font-medium text-slate-700 mt-1">
                  {formatCurrency(parsed.cardSales)}
                </p>
              </div>
            </div>
          </div>

          {/* Gross margin */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">
                Gross Margin
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {parsed.grossMargin.toFixed(1)}%
              </p>
            </div>
            <div className="mt-2 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(parsed.grossMargin * 2, 100)}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={reset}
              className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Upload another
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors gap-1.5 flex items-center">
              <CheckCircle2 size={15} />
              Save Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
