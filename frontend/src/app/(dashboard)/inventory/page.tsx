"use client";

import { useState } from "react";
import { Package, ShoppingCart, Archive, Download } from "lucide-react";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ReorderRecommendations } from "@/components/inventory/ReorderRecommendations";
import { DeadStockPanel } from "@/components/inventory/DeadStockPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInventory, useReorderRecommendations, useDeadStock } from "@/hooks/useInventory";
import { cn } from "@/lib/utils";

type Tab = "inventory" | "reorder" | "dead-stock";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "inventory", label: "All Inventory", icon: Package },
  { id: "reorder", label: "Reorder Recommendations", icon: ShoppingCart },
  { id: "dead-stock", label: "Dead Stock", icon: Archive },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("inventory");

  const { data: inventoryData, isLoading: invLoading } = useInventory();
  const { data: reorderData, isLoading: reorderLoading } =
    useReorderRecommendations();
  const { data: deadStockData, isLoading: deadLoading } = useDeadStock();

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage stock levels, reorder points, and dead inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download size={14} />
            Export
          </Button>
          <Button size="sm" className="gap-1.5">
            <Package size={14} />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total SKUs",
            value: "847",
            color: "text-slate-900",
          },
          {
            label: "Low Stock",
            value: "23",
            color: "text-amber-600",
          },
          {
            label: "Out of Stock",
            value: "7",
            color: "text-red-600",
          },
          {
            label: "Dead Stock Value",
            value: "$1,420",
            color: "text-slate-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-lg border border-slate-100 px-4 py-3"
          >
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {tabs.find((t) => t.id === activeTab)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {activeTab === "inventory" && (
            <InventoryTable
              data={inventoryData?.data}
              total={inventoryData?.total}
              isLoading={invLoading}
            />
          )}
          {activeTab === "reorder" && (
            <ReorderRecommendations
              data={reorderData}
              isLoading={reorderLoading}
            />
          )}
          {activeTab === "dead-stock" && (
            <DeadStockPanel data={deadStockData} isLoading={deadLoading} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
