import type { FlashReport } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface FlashReportListProps {
  reports: FlashReport[];
}

const statusVariant: Record<FlashReport["parseStatus"], "gray" | "info" | "success" | "danger"> = {
  PENDING: "gray",
  PROCESSING: "info",
  COMPLETED: "success",
  FAILED: "danger",
};

export function FlashReportList({ reports }: FlashReportListProps) {
  if (reports.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        No flash reports found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Date
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Sales
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Fuel
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Inside
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Transactions
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {reports.map((report) => (
            <tr key={report.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-medium text-slate-900">
                {formatDate(report.reportDate)}
              </td>
              <td className="py-3 px-4 text-right font-medium text-slate-900">
                {report.totalSales !== undefined
                  ? formatCurrency(report.totalSales)
                  : "—"}
              </td>
              <td className="py-3 px-4 text-right text-slate-600">
                {report.fuelSalesAmount !== undefined
                  ? formatCurrency(report.fuelSalesAmount)
                  : "—"}
              </td>
              <td className="py-3 px-4 text-right text-slate-600">
                {report.insideSales !== undefined
                  ? formatCurrency(report.insideSales)
                  : "—"}
              </td>
              <td className="py-3 px-4 text-right text-slate-600">
                {report.transactionCount ?? "—"}
              </td>
              <td className="py-3 px-4 text-center">
                <Badge variant={statusVariant[report.parseStatus]}>
                  {report.parseStatus}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
