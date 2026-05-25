import { formatCurrency, formatNumber } from "@/lib/utils";
import type { TopProduct } from "@/types";

const MOCK_DATA: TopProduct[] = [
  {
    rank: 1,
    productId: "p1",
    productName: "Marlboro Red 20pk",
    upc: "028000836719",
    category: "Tobacco",
    unitsSold: 142,
    revenue: 1278,
    margin: 18.4,
  },
  {
    rank: 2,
    productId: "p2",
    productName: "Red Bull 8.4oz",
    upc: "611269992702",
    category: "Beverages",
    unitsSold: 218,
    revenue: 982,
    margin: 42.1,
  },
  {
    rank: 3,
    productId: "p3",
    productName: "Newport 100s Box",
    upc: "017800015448",
    category: "Tobacco",
    unitsSold: 98,
    revenue: 931,
    margin: 17.2,
  },
  {
    rank: 4,
    productId: "p4",
    productName: "Celsius Wild Berry",
    upc: "888392012456",
    category: "Beverages",
    unitsSold: 184,
    revenue: 828,
    margin: 40.5,
  },
  {
    rank: 5,
    productId: "p5",
    productName: "Prime Hydration Blue",
    upc: "850026499039",
    category: "Beverages",
    unitsSold: 156,
    revenue: 702,
    margin: 38.7,
  },
  {
    rank: 6,
    productId: "p6",
    productName: "Powerball Lottery",
    upc: "LOTTERY-PB",
    category: "Lottery",
    unitsSold: 340,
    revenue: 680,
    margin: 6.0,
  },
  {
    rank: 7,
    productId: "p7",
    productName: "Monster Energy Green",
    upc: "070847811695",
    category: "Beverages",
    unitsSold: 127,
    revenue: 571,
    margin: 41.2,
  },
  {
    rank: 8,
    productId: "p8",
    productName: "Lay's Classic 2.625oz",
    upc: "028400589819",
    category: "Snacks",
    unitsSold: 201,
    revenue: 482,
    margin: 48.3,
  },
  {
    rank: 9,
    productId: "p9",
    productName: "5-Hour Energy Berry",
    upc: "719772110042",
    category: "Beverages",
    unitsSold: 88,
    revenue: 396,
    margin: 52.1,
  },
  {
    rank: 10,
    productId: "p10",
    productName: "Reese's PB Cup KS",
    upc: "034000004430",
    category: "Candy",
    unitsSold: 176,
    revenue: 388,
    margin: 44.7,
  },
];

interface TopProductsTableProps {
  data?: TopProduct[];
  isLoading?: boolean;
}

export function TopProductsTable({ data, isLoading }: TopProductsTableProps) {
  const products = data ?? MOCK_DATA;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-2.5 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider w-8">
              #
            </th>
            <th className="text-left py-2.5 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Product
            </th>
            <th className="text-right py-2.5 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Units
            </th>
            <th className="text-right py-2.5 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Revenue
            </th>
            <th className="text-right py-2.5 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Margin
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.productId}
              className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
            >
              <td className="py-2.5 px-2 text-xs text-slate-400 font-medium">
                {product.rank}
              </td>
              <td className="py-2.5 px-2">
                <div>
                  <p className="font-medium text-slate-800 truncate max-w-[160px]">
                    {product.productName}
                  </p>
                  <p className="text-xs text-slate-400">{product.category}</p>
                </div>
              </td>
              <td className="py-2.5 px-2 text-right text-slate-600 tabular-nums">
                {formatNumber(product.unitsSold)}
              </td>
              <td className="py-2.5 px-2 text-right font-medium text-slate-800 tabular-nums">
                {formatCurrency(product.revenue)}
              </td>
              <td className="py-2.5 px-2 text-right">
                <span
                  className={`text-xs font-semibold ${
                    product.margin > 30
                      ? "text-emerald-600"
                      : product.margin > 15
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {product.margin.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
