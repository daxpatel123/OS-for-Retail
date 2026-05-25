"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type UploadState = "idle" | "uploading" | "processing" | "done" | "error";

interface ExtractedLineItem {
  description: string;
  upc?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  matched: boolean;
}

interface ExtractedInvoice {
  vendor: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  lineItems: ExtractedLineItem[];
  confidence: number;
}

const MOCK_EXTRACTED: ExtractedInvoice = {
  vendor: "McLane Company",
  invoiceNumber: "MC-29841",
  invoiceDate: "2026-05-24",
  totalAmount: 4218.5,
  confidence: 94.2,
  lineItems: [
    {
      description: "Marlboro Red 20pk (Ctn/10)",
      upc: "028000836719",
      quantity: 5,
      unitCost: 72.0,
      totalCost: 360.0,
      matched: true,
    },
    {
      description: "Newport 100s Box (Ctn/10)",
      upc: "017800015448",
      quantity: 4,
      unitCost: 74.0,
      totalCost: 296.0,
      matched: true,
    },
    {
      description: "Red Bull 8.4oz (Case/24)",
      upc: "611269992702",
      quantity: 4,
      unitCost: 34.8,
      totalCost: 139.2,
      matched: true,
    },
    {
      description: "Celsius Wild Berry (Case/12)",
      upc: "888392012456",
      quantity: 12,
      unitCost: 15.36,
      totalCost: 184.32,
      matched: true,
    },
    {
      description: "Lay's Classic 2.625oz (Case/64)",
      upc: "028400589819",
      quantity: 3,
      unitCost: 56.96,
      totalCost: 170.88,
      matched: true,
    },
    {
      description: "Unknown SKU 4839202",
      upc: undefined,
      quantity: 2,
      unitCost: 24.0,
      totalCost: 48.0,
      matched: false,
    },
  ],
};

interface InvoiceUploaderProps {
  onSuccess?: () => void;
}

export function InvoiceUploader({ onSuccess }: InvoiceUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedInvoice | null>(null);

  const simulateUpload = useCallback(async (file: File) => {
    setSelectedFile(file);
    setUploadState("uploading");
    setProgress(0);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 80));
      setProgress(i);
    }

    setUploadState("processing");
    await new Promise((r) => setTimeout(r, 2000));

    setExtracted(MOCK_EXTRACTED);
    setUploadState("done");
    onSuccess?.();
  }, [onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && simulateUpload(files[0]),
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    disabled: uploadState !== "idle" && uploadState !== "error",
  });

  const reset = () => {
    setUploadState("idle");
    setProgress(0);
    setSelectedFile(null);
    setExtracted(null);
  };

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      {(uploadState === "idle" || uploadState === "error") && (
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
                {isDragActive ? "Drop your invoice here" : "Upload invoice"}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Drag & drop or click to browse — PDF, CSV, or image
              </p>
            </div>
            <div className="flex gap-2 mt-1">
              {["PDF", "CSV", "JPG", "PNG"].map((fmt) => (
                <span
                  key={fmt}
                  className="px-2 py-0.5 bg-slate-100 text-xs text-slate-500 rounded font-mono"
                >
                  .{fmt.toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Uploading state */}
      {uploadState === "uploading" && (
        <div className="p-5 bg-white rounded-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <FileText size={18} className="text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {selectedFile?.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Uploading...</p>
            </div>
            <span className="text-sm font-semibold text-blue-600">
              {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Processing state */}
      {uploadState === "processing" && (
        <div className="p-5 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-4">
          <Loader2 size={22} className="text-blue-500 animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900">
              AI Processing Invoice...
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              Extracting line items, matching products, calculating totals
            </p>
          </div>
        </div>
      )}

      {/* Done state — show extracted data */}
      {uploadState === "done" && extracted && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary card */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Invoice extracted successfully
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Confidence:{" "}
                  <strong>{extracted.confidence.toFixed(1)}%</strong> &bull;{" "}
                  {extracted.lineItems.filter((l) => l.matched).length}/
                  {extracted.lineItems.length} items matched
                </p>
              </div>
            </div>
            <button
              onClick={reset}
              className="p-1 rounded text-emerald-400 hover:text-emerald-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Invoice details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Vendor", value: extracted.vendor },
              { label: "Invoice #", value: extracted.invoiceNumber },
              { label: "Date", value: extracted.invoiceDate },
              { label: "Total", value: formatCurrency(extracted.totalAmount) },
            ].map((d) => (
              <div
                key={d.label}
                className="bg-white rounded-lg border border-slate-100 px-3 py-2.5"
              >
                <p className="text-xs text-slate-400">{d.label}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                  {d.value}
                </p>
              </div>
            ))}
          </div>

          {/* Line items */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">
                Extracted Line Items
              </p>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Eye size={13} />
                Preview original
              </Button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    UPC
                  </th>
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-center py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Matched
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {extracted.lineItems.map((item, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "hover:bg-slate-50 transition-colors",
                      !item.matched && "bg-amber-50/50"
                    )}
                  >
                    <td className="py-2.5 px-4 text-slate-700">{item.description}</td>
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-500">
                      {item.upc ?? (
                        <span className="text-amber-600">Not found</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-600 tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-600 tabular-nums">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-slate-800 tabular-nums">
                      {formatCurrency(item.totalCost)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {item.matched ? (
                        <CheckCircle2 size={15} className="text-emerald-500 mx-auto" />
                      ) : (
                        <AlertCircle size={15} className="text-amber-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-100">
                <tr>
                  <td colSpan={4} className="py-2.5 px-4 text-right text-sm font-semibold text-slate-700">
                    Total:
                  </td>
                  <td className="py-2.5 px-4 text-right text-sm font-bold text-slate-900 tabular-nums">
                    {formatCurrency(extracted.totalAmount)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="md" onClick={reset}>
              Upload another
            </Button>
            <Button variant="secondary" size="md">
              Save as draft
            </Button>
            <Button size="md" className="gap-1.5">
              <CheckCircle2 size={15} />
              Approve & Post
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
