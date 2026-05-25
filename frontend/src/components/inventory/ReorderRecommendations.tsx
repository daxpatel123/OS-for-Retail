"use client";

import { ShoppingCart, AlertTriangle, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { ReorderRecommendation } from "@/types";

const MOCK_RECOMMENDATIONS: ReorderRecommendation[] = [
  {
    productId: "p1",
    product: {
      id: "p1",
      organizationId: "org-1",
      upc: "028000836719",
      name: "Marlboro Red 20pk",
      categoryId: "c1",
      category: { id: "c1", name: "Tobacco" },
      costPrice: 7.2,
      retailPrice: 9.0,
      taxRate: 8,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    currentQuantity: 12,
    reorderPoint: 20,
    suggestedQuantity: 50,
    estimatedCost: 360,
    urgency: "HIGH",
    vendorName: "McLane Company",
    lastOrderDate: "2026-05-15",
  },
  {
    productId: "p3",
    product: {
      id: "p3",
      organizationId: "org-1",
      upc: "017800015448",
      name: "Newport 100s Box",
      categoryId: "c1",
      category: { id: "c1", name: "Tobacco" },
      costPrice: 7.4,
      retailPrice: 9.5,
      taxRate: 8,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    currentQuantity: 0,
    reorderPoint: 15,
    suggestedQuantity: 40,
    estimatedCost: 296,
    urgency: "HIGH",
    vendorName: "McLane Company",
    lastOrderDate: "2026-05-14",
  },
  {
    productId: "p6",
    product: {
      id: "p6",
      organizationId: "org-1",
      upc: "070847021095",
      name: "Monster Zero Ultra 16oz",
      categoryId: "c2",
      category: { id: "c2", name: "Beverages" },
      costPrice: 1.38,
      retailPrice: 3.79,
      taxRate: 8,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    currentQuantity: 22,
    reorderPoint: 36,
    suggestedQuantity: 96,
    estimatedCost: 132.48,
    urgency: "MEDIUM",
    vendorName: "Core-Mark",
    lastOrderDate: "2026-05-18",
  },
];

const urgencyConfig = {
  HIGH: { variant: "destructive" as const, label: "High", icon: AlertTriangle },
  MEDIUM: { variant: "warning" as const, label: "Medium", icon: AlertTriangle },
  LOW: { variant: "info" as const, label: "Low", icon: AlertTriangle },
};

interface ReorderRecommendationsProps {
  data?: ReorderRecommendation[];
  isLoading?: boolean;
}

export function ReorderRecommendations({
  data,
  isLoading,
}: ReorderRecommendationsProps) {
  const items = data ?? MOCK_RECOMMENDATIONS;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          No reorder recommendations at this time.
        </div>
      )}
      {items.map((item) => {
        const uc = urgencyConfig[item.urgency];
        return (
          <div
            key={item.productId}
            className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition-shadow"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
              <ShoppingCart size={18} className="text-slate-500" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-slate-800 text-sm truncate">
                  {item.product.name}
                </p>
                <Badge variant={uc.variant}>{uc.label} Priority</Badge>
              </div>
              <p className="text-xs text-slate-500 mb-2">
                {item.product.category?.name} &bull; Vendor: {item.vendorName}
              </p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="text-slate-500">
                  On hand:{" "}
                  <strong
                    className={
                      item.currentQuantity === 0
                        ? "text-red-600"
                        : "text-slate-700"
                    }
                  >
                    {item.currentQuantity}
                  </strong>
                </span>
                <span className="text-slate-500">
                  Reorder pt:{" "}
                  <strong className="text-slate-700">{item.reorderPoint}</strong>
                </span>
                <span className="text-slate-500">
                  Suggest:{" "}
                  <strong className="text-blue-700">{item.suggestedQuantity} units</strong>
                </span>
                <span className="text-slate-500">
                  Est. cost:{" "}
                  <strong className="text-slate-700">
                    {formatCurrency(item.estimatedCost)}
                  </strong>
                </span>
              </div>
            </div>

            <Button variant="outline" size="sm" className="flex-shrink-0 gap-1.5">
              <Truck size={13} />
              Order
            </Button>
          </div>
        );
      })}

      {items.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div>
            <p className="text-sm font-semibold text-blue-900">
              {items.length} items need reordering
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Total estimated order:{" "}
              <strong>
                {formatCurrency(
                  items.reduce((sum, i) => sum + i.estimatedCost, 0)
                )}
              </strong>
            </p>
          </div>
          <Button size="sm" className="gap-1.5">
            <Truck size={14} />
            Create Purchase Order
          </Button>
        </div>
      )}
    </div>
  );
}
