"use client";

import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { InvoiceUploader } from "@/components/invoices/InvoiceUploader";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInvoices } from "@/hooks/useInvoices";
import type { Invoice } from "@/types";
import { cn } from "@/lib/utils";

type Tab = "list" | "upload";

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoiceData, isLoading } = useInvoices();

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            AI-powered invoice processing and approval workflow
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setActiveTab("upload")}
        >
          <Upload size={14} />
          Upload Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "This Month", value: "24", sub: "total invoices" },
          { label: "Pending Review", value: "5", sub: "need attention", highlight: true },
          { label: "Approved", value: "14", sub: "ready to post" },
          { label: "Processing", value: "2", sub: "AI extracting" },
          { label: "Total Value", value: "$48,210", sub: "month to date" },
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
            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {([["list", "Invoice List", FileText], ["upload", "Upload New", Upload]] as const).map(
          ([id, label, Icon]) => (
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
          )
        )}
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "list" ? "All Invoices" : "Upload Invoice"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {activeTab === "list" ? (
            <InvoiceList
              data={invoiceData?.data}
              isLoading={isLoading}
              onSelect={setSelectedInvoice}
            />
          ) : (
            <InvoiceUploader
              onSuccess={() => setActiveTab("list")}
            />
          )}
        </CardContent>
      </Card>

      {/* Invoice detail modal */}
      {selectedInvoice && (
        <InvoiceDetail
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
