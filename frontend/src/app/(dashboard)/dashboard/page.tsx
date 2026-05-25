"use client";

import { DollarSign, Fuel, ShoppingBag, TrendingUp } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { TopProductsTable } from "@/components/dashboard/TopProductsTable";
import { AlertsFeed } from "@/components/dashboard/AlertsFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useDashboardSummary,
  useSalesTrend,
  useCategoryBreakdown,
  useTopProducts,
  useDashboardAlerts,
} from "@/hooks/useDashboard";
import { useAppStore } from "@/store/appStore";
import { formatCurrency, formatPercent } from "@/lib/utils";

// Mock summary data for when API isn't available
const MOCK_SUMMARY = {
  date: "2026-05-25",
  totalSales: 22340,
  fuelSales: 14870,
  insideSales: 7470,
  netMargin: 18.3,
  totalTransactions: 412,
  averageTicket: 54.23,
  totalSalesChange: 8.2,
  fuelSalesChange: 6.4,
  insideSalesChange: 12.1,
  netMarginChange: 1.4,
};

export default function DashboardPage() {
  const { selectedDate, setSelectedDate } = useAppStore();

  const { data: summary, isLoading: summaryLoading } =
    useDashboardSummary(selectedDate);
  const { data: salesTrend, isLoading: trendLoading } = useSalesTrend(7);
  const { data: categoryData, isLoading: catLoading } =
    useCategoryBreakdown(selectedDate);
  const { data: topProducts, isLoading: productsLoading } =
    useTopProducts(10, selectedDate);
  const { data: alerts, isLoading: alertsLoading } = useDashboardAlerts();

  const s = summary ?? MOCK_SUMMARY;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Today&apos;s performance overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Sales"
          value={formatCurrency(s.totalSales)}
          change={s.totalSalesChange}
          icon={DollarSign}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          isLoading={summaryLoading}
        />
        <KPICard
          title="Fuel Sales"
          value={formatCurrency(s.fuelSales)}
          change={s.fuelSalesChange}
          icon={Fuel}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
          isLoading={summaryLoading}
        />
        <KPICard
          title="Inside Sales"
          value={formatCurrency(s.insideSales)}
          change={s.insideSalesChange}
          icon={ShoppingBag}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          isLoading={summaryLoading}
        />
        <KPICard
          title="Net Margin"
          value={`${s.netMargin.toFixed(1)}%`}
          change={s.netMarginChange}
          changeLabel="vs yesterday"
          icon={TrendingUp}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          isLoading={summaryLoading}
        />
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Transactions", value: s.totalTransactions.toLocaleString() },
          {
            label: "Avg Ticket",
            value: formatCurrency(s.averageTicket),
          },
          { label: "Active Alerts", value: "3", highlight: true },
          { label: "Pending Invoices", value: "5" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg border border-slate-100 px-4 py-3"
          >
            <p className="text-xs text-slate-400 mb-0.5">{stat.label}</p>
            <p
              className={`text-lg font-bold ${
                stat.highlight ? "text-red-600" : "text-slate-900"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Sales Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sales Trend — Last 7 Days</CardTitle>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />
                Total
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-orange-500 inline-block rounded" />
                Fuel
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />
                Inside
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SalesTrendChart data={salesTrend} isLoading={trendLoading} />
        </CardContent>
      </Card>

      {/* Category Breakdown + Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart
              data={categoryData}
              isLoading={catLoading}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top 10 Products</CardTitle>
              <span className="text-xs text-slate-400">By revenue today</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <TopProductsTable
              data={topProducts}
              isLoading={productsLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Alerts Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Alerts</CardTitle>
            <a
              href="/alerts"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
            </a>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <AlertsFeed data={alerts} isLoading={alertsLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
