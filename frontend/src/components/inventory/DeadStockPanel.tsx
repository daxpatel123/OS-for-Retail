"use client";

import { Archive, TrendingDown, Tag, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { DeadStockItem } from "@/types";

const MOCK_DEAD_STOCK: DeadStockItem[] = [
  {
    productId: "p7",
    product: {
      id: "p7",
      organizationId: "org-1",
      upc: "071720034729",
      name: "Chapstick Original",
      categoryId: "c4",
      category: { id: "c4", name: "Health & Beauty" },
      costPrice: 1.2,
      retailPrice: 3.49,
      taxRate: 0,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    quantityOnHand: 48,
    daysSinceLastSale: 92,
    estimatedValue: 57.6,
    recommendation: "Mark down 30% to clear. Consider moving to checkout counter display.",
  },
  {
    productId: "p8",
    product: {
      id: "p8",
      organizationId: "org-1",
      upc: "012000001765",
      name: "Diet Pepsi 20oz",
      categoryId: "c2",
      category: { id: "c2", name: "Beverages" },
      costPrice: 0.65,
      retailPrice: 2.19,
      taxRate: 8,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    quantityOnHand: 24,
    daysSinceLastSale: 45,
    estimatedValue: 15.6,
    recommendation: "Move to promotional end-cap. Consider bundle with snacks.",
  },
  {
    productId: "p9",
    product: {
      id: "p9",
      organizationId: "org-1",
      upc: "041415028428",
      name: "Vitamin C 500mg 60ct",
      categoryId: "c4",
      category: { id: "c4", name: "Health & Beauty" },
      costPrice: 3.8,
      retailPrice: 8.99,
      taxRate: 0,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    quantityOnHand: 18,
    daysSinceLastSale: 62,
    estimatedValue: 68.4,
    recommendation: "Return to vendor or deeply discount. High carrying cost.",
  },
];

interface DeadStockPanelProps {
  data?: DeadStockItem[];
  isLoading?: boolean;
}

export function DeadStockPanel({ data, isLoading }: DeadStockPanelProps) {
  const items = data ?? MOCK_DEAD_STOCK;

  const totalValue = items.reduce((sum, i) => sum + i.estimatedValue, 0);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary banner */}
      <div className="flex items-center gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-100">
        <Archive size={18} className="text-amber-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            {items.length} dead stock items identified
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Total tied-up value:{" "}
            <strong>{formatCurrency(totalValue)}</strong> cost basis
          </p>
        </div>
      </div>

      {items.map((item) => {
        const dayLabel =
          item.daysSinceLastSale > 90 ? "destructive" : "warning";
        return (
          <div
            key={item.productId}
            className="p-4 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingDown size={15} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm">
                      {item.product.name}
                    </p>
                    <Badge variant={dayLabel as "warning" | "destructive"}>
                      {item.daysSinceLastSale} days no sale
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.product.category?.name} &bull; {item.quantityOnHand}{" "}
                    units &bull; {formatCurrency(item.estimatedValue)} cost
                  </p>
                  <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">AI Recommendation: </span>
                      {item.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  <Tag size={11} />
                  Markdown
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={11} />
                  Write off
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
