import type { TopProduct } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface TopProductsTableProps {
  products: TopProduct[];
}

export function TopProductsTable({ products }: TopProductsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-8">
              #
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Product
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Category
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Revenue
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Units
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {products.map((product, index) => (
            <tr key={product.productId} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 text-slate-400 font-medium">{index + 1}</td>
              <td className="py-3 px-4 font-medium text-slate-900">
                {product.productName}
              </td>
              <td className="py-3 px-4 text-slate-500">{product.category}</td>
              <td className="py-3 px-4 text-right font-medium text-slate-900">
                {formatCurrency(product.totalRevenue)}
              </td>
              <td className="py-3 px-4 text-right text-slate-600">
                {formatNumber(product.unitsSold)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
