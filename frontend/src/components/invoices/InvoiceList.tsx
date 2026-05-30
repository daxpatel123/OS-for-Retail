import type { Invoice } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoiceListProps {
  invoices: Invoice[];
}

const statusVariant: Record<Invoice["status"], "gray" | "info" | "danger" | "success" | "default" | "warning"> = {
  PENDING: "gray",
  MATCHED: "info",
  DISCREPANCY: "danger",
  APPROVED: "success",
  PAID: "default",
};

const ocrVariant: Record<Invoice["ocrStatus"], "gray" | "info" | "warning" | "success" | "danger"> = {
  PENDING: "gray",
  PROCESSING: "info",
  COMPLETED: "success",
  FAILED: "danger",
};

export function InvoiceList({ invoices }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        No invoices found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Invoice #
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Date
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              OCR
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-medium text-slate-900">
                {invoice.invoiceNumber ?? `#${invoice.id.slice(0, 8)}`}
              </td>
              <td className="py-3 px-4 text-slate-600">
                {invoice.invoiceDate ? formatDate(invoice.invoiceDate) : "—"}
              </td>
              <td className="py-3 px-4 text-center">
                <Badge variant={ocrVariant[invoice.ocrStatus]}>
                  {invoice.ocrStatus}
                </Badge>
              </td>
              <td className="py-3 px-4 text-right font-medium text-slate-900">
                {invoice.totalAmount !== undefined
                  ? formatCurrency(invoice.totalAmount)
                  : "—"}
              </td>
              <td className="py-3 px-4 text-center">
                <Badge variant={statusVariant[invoice.status]}>
                  {invoice.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
