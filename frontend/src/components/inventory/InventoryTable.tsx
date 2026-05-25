"use client";

import { useState } from "react";
import { Search, Filter, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Inventory, StockStatus } from "@/types";

const MOCK_INVENTORY: Inventory[] = [
  {
    id: "i1",
    storeId: "store-1",
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
    quantityOnHand: 12,
    reorderPoint: 20,
    reorderQuantity: 50,
    daysOfSupply: 2.1,
    lastSoldAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: "LOW_STOCK",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "i2",
    storeId: "store-1",
    productId: "p2",
    product: {
      id: "p2",
      organizationId: "org-1",
      upc: "611269992702",
      name: "Red Bull 8.4oz",
      categoryId: "c2",
      category: { id: "c2", name: "Beverages" },
      costPrice: 1.45,
      retailPrice: 4.49,
      taxRate: 8,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    quantityOnHand: 84,
    reorderPoint: 24,
    reorderQuantity: 96,
    daysOfSupply: 12.4,
    lastSoldAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: "IN_STOCK",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "i3",
    storeId: "store-1",
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
    quantityOnHand: 0,
    reorderPoint: 15,
    reorderQuantity: 40,
    daysOfSupply: 0,
    lastSoldAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "OUT_OF_STOCK",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "i4",
    storeId: "store-1",
    productId: "p4",
    product: {
      id: "p4",
      organizationId: "org-1",
      upc: "888392012456",
      name: "Celsius Wild Berry 12oz",
      categoryId: "c2",
      category: { id: "c2", name: "Beverages" },
      costPrice: 1.28,
      retailPrice: 3.49,
      taxRate: 8,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    quantityOnHand: 156,
    reorderPoint: 48,
    reorderQuantity: 144,
    daysOfSupply: 21.8,
    lastSoldAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: "IN_STOCK",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "i5",
    storeId: "store-1",
    productId: "p5",
    product: {
      id: "p5",
      organizationId: "org-1",
      upc: "028400589819",
      name: "Lay's Classic 2.625oz",
      categoryId: "c3",
      category: { id: "c3", name: "Snacks" },
      costPrice: 0.89,
      retailPrice: 2.39,
      taxRate: 8,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    },
    quantityOnHand: 38,
    reorderPoint: 24,
    reorderQuantity: 72,
    daysOfSupply: 6.1,
    lastSoldAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    status: "IN_STOCK",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "i6",
    storeId: "store-1",
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
    quantityOnHand: 22,
    reorderPoint: 36,
    reorderQuantity: 96,
    daysOfSupply: 3.8,
    lastSoldAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: "LOW_STOCK",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "i7",
    storeId: "store-1",
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
    reorderPoint: 12,
    reorderQuantity: 24,
    daysOfSupply: 92.3,
    lastSoldAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    status: "DEAD_STOCK",
    updatedAt: new Date().toISOString(),
  },
];

const statusConfig: Record<
  StockStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "gray" }
> = {
  IN_STOCK: { label: "In Stock", variant: "success" },
  LOW_STOCK: { label: "Low Stock", variant: "warning" },
  OUT_OF_STOCK: { label: "Out of Stock", variant: "destructive" },
  DEAD_STOCK: { label: "Dead Stock", variant: "gray" },
};

interface InventoryTableProps {
  data?: Inventory[];
  total?: number;
  isLoading?: boolean;
  onSearch?: (q: string) => void;
  onFilterStatus?: (s: string) => void;
}

export function InventoryTable({
  data,
  isLoading,
  onSearch,
  onFilterStatus,
}: InventoryTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const items = data ?? MOCK_INVENTORY;

  const filtered = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.product?.name.toLowerCase().includes(search.toLowerCase()) ||
      item.product?.upc.includes(search);
    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search products or UPC..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onSearch?.(e.target.value);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          {(["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "DEAD_STOCK"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  onFilterStatus?.(s);
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                  statusFilter === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                )}
              >
                {s === "ALL"
                  ? "All"
                  : s
                      .replace("_", " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            )
          )}
        </div>

        <Button variant="outline" size="sm" className="ml-auto gap-1.5">
          <RefreshCw size={13} />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  UPC
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  On Hand
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Reorder Pt
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Days Supply
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Retail
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="py-3 px-4">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((item) => {
                    const sc = statusConfig[item.status];
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-800">
                            {item.product?.name ?? "—"}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Last sold:{" "}
                            {item.lastSoldAt
                              ? formatDate(item.lastSoldAt, "MMM d, h:mm a")
                              : "—"}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                          {item.product?.upc ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.product?.category?.name ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={cn(
                              "font-bold tabular-nums",
                              item.quantityOnHand === 0
                                ? "text-red-600"
                                : item.quantityOnHand <= item.reorderPoint
                                ? "text-amber-600"
                                : "text-slate-800"
                            )}
                          >
                            {item.quantityOnHand}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 tabular-nums">
                          {item.reorderPoint}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">
                          <span
                            className={cn(
                              "font-medium",
                              item.daysOfSupply === 0
                                ? "text-red-600"
                                : item.daysOfSupply < 5
                                ? "text-amber-600"
                                : "text-slate-700"
                            )}
                          >
                            {item.daysOfSupply === 0
                              ? "—"
                              : `${item.daysOfSupply.toFixed(1)}d`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700 tabular-nums">
                          {item.product
                            ? formatCurrency(item.product.retailPrice)
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">
            No products match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
