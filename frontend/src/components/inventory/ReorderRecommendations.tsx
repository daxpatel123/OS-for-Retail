import type { ReorderRecommendation } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface ReorderRecommendationsProps {
  recommendations: ReorderRecommendation[];
}

const urgencyVariant = {
  CRITICAL: "danger",
  HIGH: "warning",
  MEDIUM: "info",
} as const;

export function ReorderRecommendations({
  recommendations,
}: ReorderRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        No reorder recommendations at this time
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Product
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Current Stock
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Reorder Qty
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Vendor
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Est. Cost
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Urgency
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {recommendations.map((rec) => (
            <tr key={rec.productId} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-medium text-slate-900">
                {rec.productName}
              </td>
              <td className="py-3 px-4 text-right text-slate-600">
                {formatNumber(rec.currentStock)}
              </td>
              <td className="py-3 px-4 text-right text-slate-600">
                {formatNumber(rec.reorderQuantity)}
              </td>
              <td className="py-3 px-4 text-slate-500">
                {rec.vendorName ?? "—"}
              </td>
              <td className="py-3 px-4 text-right text-slate-600">
                {rec.estimatedCost !== undefined
                  ? formatCurrency(rec.estimatedCost)
                  : "—"}
              </td>
              <td className="py-3 px-4 text-center">
                <Badge variant={urgencyVariant[rec.urgency]}>{rec.urgency}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
