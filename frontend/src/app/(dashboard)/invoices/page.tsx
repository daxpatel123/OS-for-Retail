"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { InvoiceUploader } from "@/components/invoices/InvoiceUploader";
import type { Invoice } from "@/types";

const mockInvoices: Invoice[] = [
  {
    id: "inv001",
    storeId: "s1",
    vendorId: "v1",
    invoiceNumber: "INV-2248",
    invoiceDate: "2026-05-29",
    dueDate: "2026-06-05",
    ocrStatus: "COMPLETED",
    subtotal: 1840.20,
    taxAmount: 0,
    totalAmount: 1840.20,
    status: "DISCREPANCY",
    createdAt: "2026-05-29T10:30:00Z",
  },
  {
    id: "inv002",
    storeId: "s1",
    vendorId: "v1",
    invoiceNumber: "INV-2199",
    invoiceDate: "2026-05-22",
    dueDate: "2026-05-29",
    ocrStatus: "COMPLETED",
    subtotal: 2105.80,
    taxAmount: 0,
    totalAmount: 2105.80,
    status: "PAID",
    createdAt: "2026-05-22T09:15:00Z",
  },
  {
    id: "inv003",
    storeId: "s1",
    vendorId: "v2",
    invoiceNumber: "BP-44821",
    invoiceDate: "2026-05-28",
    dueDate: "2026-06-04",
    ocrStatus: "COMPLETED",
    subtotal: 9840.00,
    taxAmount: 0,
    totalAmount: 9840.00,
    status: "APPROVED",
    createdAt: "2026-05-28T14:00:00Z",
  },
  {
    id: "inv004",
    storeId: "s1",
    vendorId: "v3",
    invoiceNumber: "PEP-00912",
    invoiceDate: "2026-05-30",
    ocrStatus: "PROCESSING",
    status: "PENDING",
    createdAt: "2026-05-30T08:00:00Z",
  },
];

export default function InvoicesPage() {
  const [showUploader, setShowUploader] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {mockInvoices.length} invoices total
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowUploader((v) => !v)}
        >
          <Plus size={16} />
          Upload Invoice
        </Button>
      </div>

      {showUploader && (
        <Card>
          <CardHeader>
            <CardTitle>Upload New Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceUploader />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <InvoiceList invoices={mockInvoices} />
        </CardContent>
      </Card>
    </div>
  );
}
