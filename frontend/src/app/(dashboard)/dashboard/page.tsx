"use client";

import { DollarSign, Fuel, ShoppingBag, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/KPICard";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { TopProductsTable } from "@/components/dashboard/TopProductsTable";
import { AlertsFeed } from "@/components/dashboard/AlertsFeed";
import { formatCurrency } from "@/lib/utils";
import type { SalesTrendPoint, TopProduct, Alert } from "@/types";

const mockTrend: SalesTrendPoint[] = [
  { date: "May 24", totalSales: 18200, fuelSales: 12400, insideSales: 5800 },
  { date: "May 25", totalSales: 21500, fuelSales: 14800, insideSales: 6700 },
  { date: "May 26", totalSales: 19800, fuelSales: 13200, insideSales: 6600 },
  { date: "May 27", totalSales: 23100, fuelSales: 15900, insideSales: 7200 },
  { date: "May 28", totalSales: 17600, fuelSales: 11800, insideSales: 5800 },
  { date: "May 29", totalSales: 24900, fuelSales: 17200, insideSales: 7700 },
  { date: "May 30", totalSales: 22400, fuelSales: 15100, insideSales: 7300 },
];

const mockProducts: TopProduct[] = [
  { productId: "p1", productName: "Regular Unleaded (Gal)", category: "Fuel", totalRevenue: 8420, unitsSold: 2810 },
  { productId: "p2", productName: "Red Bull 8.4oz", category: "Beverages", totalRevenue: 1240, unitsSold: 620 },
  { productId: "p3", productName: "Marlboro Red King", category: "Tobacco", totalRevenue: 1080, unitsSold: 180 },
  { productId: "p4", productName: "Monster Energy 16oz", category: "Beverages", totalRevenue: 890, unitsSold: 445 },
  { productId: "p5", productName: "Lottery Scratch-Off", category: "Lottery", totalRevenue: 760, unitsSold: 380 },
];

const mockAlerts: Alert[] = [
  {
    id: "a1",
    orgId: "org1",
    storeId: "s1",
    alertType: "LOW_STOCK",
    severity: "HIGH",
    title: "Red Bull 8.4oz Low Stock",
    message: "Only 8 units remaining. Reorder point is 24 units.",
    status: "OPEN",
    createdAt: "2026-05-30T08:15:00Z",
  },
  {
    id: "a2",
    orgId: "org1",
    storeId: "s1",
    alertType: "INVOICE_DISCREPANCY",
    severity: "MEDIUM",
    title: "Invoice #INV-2248 Discrepancy",
    message: "Line item quantity mismatch detected on McLane delivery.",
    status: "OPEN",
    createdAt: "2026-05-30T07:42:00Z",
  },
  {
    id: "a3",
    orgId: "org1",
    storeId: "s1",
    alertType: "CASH_SHORT",
    severity: "HIGH",
    title: "Cash Drawer Short $47.20",
    message: "End-of-day cash count does not match POS total.",
    status: "ACKNOWLEDGED",
    createdAt: "2026-05-29T23:05:00Z",
  },
];

const kpis = [
  {
    title: "Total Sales",
    value: formatCurrency(22400),
    change: 4.2,
    icon: <DollarSign size={20} className="text-blue-600" />,
    color: "bg-blue-50",
  },
  {
    title: "Fuel Sales",
    value: formatCurrency(15100),
    change: -1.8,
    icon: <Fuel size={20} className="text-amber-600" />,
    color: "bg-amber-50",
  },
  {
    title: "Inside Sales",
    value: formatCurrency(7300),
    change: 9.1,
    icon: <ShoppingBag size={20} className="text-emerald-600" />,
    color: "bg-emerald-50",
  },
  {
    title: "Gross Margin",
    value: "32.4%",
    change: 1.3,
    icon: <TrendingUp size={20} className="text-purple-600" />,
    color: "bg-purple-50",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Sales Trend — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <SalesTrendChart data={mockTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AlertsFeed alerts={mockAlerts} />
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products — Today</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TopProductsTable products={mockProducts} />
        </CardContent>
      </Card>
    </div>
  );
}
