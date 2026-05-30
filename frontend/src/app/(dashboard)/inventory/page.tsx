"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ReorderRecommendations } from "@/components/inventory/ReorderRecommendations";
import { cn } from "@/lib/utils";
import type { Inventory, ReorderRecommendation } from "@/types";

const mockInventory: Inventory[] = [
  {
    id: "inv1",
    storeId: "s1",
    productId: "p1",
    product: {
      id: "p1",
      name: "Red Bull 8.4oz",
      upc: "611269991510",
      cost: 1.42,
      retailPrice: 2.99,
      unitOfMeasure: "EA",
      isActive: true,
      reorderPoint: 24,
      reorderQuantity: 48,
    },
    quantityOnHand: 8,
    lastUpdatedAt: "2026-05-30T06:00:00Z",
  },
  {
    id: "inv2",
    storeId: "s1",
    productId: "p2",
    product: {
      id: "p2",
      name: "Monster Energy 16oz",
      upc: "070847811695",
      cost: 1.60,
      retailPrice: 3.49,
      unitOfMeasure: "EA",
      isActive: true,
      reorderPoint: 24,
      reorderQuantity: 48,
    },
    quantityOnHand: 36,
    lastUpdatedAt: "2026-05-30T06:00:00Z",
  },
  {
    id: "inv3",
    storeId: "s1",
    productId: "p3",
    product: {
      id: "p3",
      name: "Marlboro Red King Box",
      upc: "028000100049",
      cost: 5.80,
      retailPrice: 9.99,
      unitOfMeasure: "PK",
      isActive: true,
      reorderPoint: 10,
      reorderQuantity: 20,
    },
    quantityOnHand: 0,
    lastUpdatedAt: "2026-05-29T22:15:00Z",
  },
  {
    id: "inv4",
    storeId: "s1",
    productId: "p4",
    product: {
      id: "p4",
      name: "Lay's Classic 2.625oz",
      upc: "028400090827",
      cost: 0.89,
      retailPrice: 1.99,
      unitOfMeasure: "EA",
      isActive: true,
      reorderPoint: 20,
      reorderQuantity: 40,
    },
    quantityOnHand: 52,
    lastUpdatedAt: "2026-05-30T06:00:00Z",
  },
  {
    id: "inv5",
    storeId: "s1",
    productId: "p5",
    product: {
      id: "p5",
      name: "Coca-Cola 20oz",
      upc: "049000028911",
      cost: 0.75,
      retailPrice: 2.29,
      unitOfMeasure: "EA",
      isActive: true,
      reorderPoint: 48,
      reorderQuantity: 96,
    },
    quantityOnHand: 84,
    lastUpdatedAt: "2026-05-30T06:00:00Z",
  },
];

const mockRecommendations: ReorderRecommendation[] = [
  {
    productId: "p1",
    productName: "Red Bull 8.4oz",
    currentStock: 8,
    reorderPoint: 24,
    reorderQuantity: 48,
    vendorName: "McLane",
    estimatedCost: 68.16,
    urgency: "HIGH",
  },
  {
    productId: "p3",
    productName: "Marlboro Red King Box",
    currentStock: 0,
    reorderPoint: 10,
    reorderQuantity: 20,
    vendorName: "McLane",
    estimatedCost: 116.00,
    urgency: "CRITICAL",
  },
];

const tabs = [
  { id: "all", label: "All Inventory" },
  { id: "reorder", label: "Reorder Needed" },
  { id: "dead", label: "Dead Stock" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabId>("all");

  const deadStock = mockInventory.filter((i) => i.quantityOnHand > 0 && i.product.maxStock !== undefined && i.quantityOnHand > i.product.maxStock);

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "all" && "All Inventory"}
            {activeTab === "reorder" && "Reorder Recommendations"}
            {activeTab === "dead" && "Dead Stock"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {activeTab === "all" && (
            <InventoryTable items={mockInventory} />
          )}
          {activeTab === "reorder" && (
            <ReorderRecommendations recommendations={mockRecommendations} />
          )}
          {activeTab === "dead" && (
            <InventoryTable items={deadStock} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
