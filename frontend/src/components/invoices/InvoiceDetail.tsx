"use client";

import { X, CheckCircle2, XCircle, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice } from "@/types";

interface InvoiceDetailProps {
  invoice: Invoice;
  onClose: () => void;
  onApprove?: () => void;
}

const MOCK_LINE_ITEMS = [
  {
    id: "l1",
    invoiceId: "inv-1",
    description: "Marlboro Red 20pk (Ctn/10)",
    upc: "028000836719",
    quantity: 5,
    unitCost: 72.0,
    totalCost: 360.0,
    matched: true,
  },
  {
    id: "l2",
    invoiceId: "inv-1",
    description: "Newport 100s Box (Ctn/10)",
    upc: "017800015448",
    quantity: 4,
    unitCost: 74.0,
    totalCost: 296.0,
    matched: true,
  },
  {
    id: "l3",
    invoiceId: "inv-1",
    description: "Red Bull 8.4oz (Case/24)",
    upc: "611269992702",
    quantity: 4,
    unitCost: 34.8,
    totalCost: 139.2,
    matched: true,
  },
  {
    id: "l4",
    invoiceId: "inv-1",
    description: "Unknown SKU 4839202",
    quantity: 2,
    unitCost: 24.0,
    totalCost: 48.0,
    matched: false,
  },
];

export function InvoiceDetail({
  invoice,
  onClose,
  onApprove,
}: InvoiceDetailProps) {
  const lineItems =
    invoice.lineItems.length > 0 ? invoice.lineItems : MOCK_LINE_ITEMS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {invoice.vendor?.name ?? "Invoice"}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Invoice #{invoice.invoiceNumber} &bull;{" "}
              {invoice.invoiceDate && formatDate(invoice.invoiceDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total", value: formatCurrency(invoice.totalAmount) },
              {
                label: "Due Date",
                value: invoice.dueDate ? formatDate(invoice.dueDate) : "—",
              },
              {
                label: "OCR Confidence",
                value: invoice.ocrConfidence
                  ? `${invoice.ocrConfidence.toFixed(1)}%`
                  : "—",
              },
              { label: "Status", value: invoice.status },
            ].map((d) => (
              <div
                key={d.label}
                className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100"
              >
                <p className="text-xs text-slate-400">{d.label}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {d.value}
                </p>
              </div>
            ))}
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Line Items
            </h3>
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                      UPC
                    </th>
                    <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-center py-2.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Match
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 text-slate-700">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-slate-400 hidden md:table-cell">
                        {item.upc ?? (
                          <span className="text-amber-600">—</span>
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
                          <CheckCircle2
                            size={15}
                            className="text-emerald-500 mx-auto"
                          />
                        ) : (
                          <Badge variant="warning">Unmatched</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-100">
                  <tr>
                    <td
                      colSpan={4}
                      className="py-2.5 px-4 text-right text-sm font-semibold text-slate-700"
                    >
                      Total:
                    </td>
                    <td className="py-2.5 px-4 text-right text-sm font-bold text-slate-900 tabular-nums">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-100 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Printer size={14} />
            Print
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Download size={14} />
            Download
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle size={15} />
              Reject
            </Button>
            {invoice.status !== "APPROVED" && invoice.status !== "POSTED" && (
              <Button
                size="md"
                className="gap-1.5"
                onClick={onApprove}
              >
                <CheckCircle2 size={15} />
                Approve
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
