"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { Inventory } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDateTime } from "@/lib/utils";

interface InventoryTableProps {
  items: Inventory[];
}

function getStockBadge(qty: number, reorderPoint?: number) {
  if (qty <= 0)
    return <Badge variant="danger">Out of Stock</Badge>;
  if (reorderPoint !== undefined && qty <= reorderPoint)
    return <Badge variant="warning">Low Stock</Badge>;
  return <Badge variant="success">In Stock</Badge>;
}

export function InventoryTable({ items }: InventoryTableProps) {
  const [search, setSearch] = useState("");

  const filtered = items.filter((item) =>
    item.product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Product
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                On Hand
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Reorder Point
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No products found
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{item.product.name}</p>
                    {item.product.upc && (
                      <p className="text-xs text-slate-400">UPC: {item.product.upc}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900">
                    {formatNumber(item.quantityOnHand)}{" "}
                    <span className="text-xs text-slate-400">
                      {item.product.unitOfMeasure}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getStockBadge(item.quantityOnHand, item.product.reorderPoint)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {item.product.reorderPoint !== undefined
                      ? formatNumber(item.product.reorderPoint)
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 text-xs">
                    {formatDateTime(item.lastUpdatedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
