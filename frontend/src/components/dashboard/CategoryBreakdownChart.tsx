"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { CategoryBreakdown } from "@/types";

const MOCK_DATA: CategoryBreakdown[] = [
  { category: "Tobacco", sales: 8420, percentage: 28.4, color: "#f97316" },
  { category: "Beverages", sales: 5930, percentage: 20.0, color: "#3b82f6" },
  { category: "Snacks", sales: 4210, percentage: 14.2, color: "#8b5cf6" },
  { category: "Candy", sales: 3100, percentage: 10.5, color: "#ec4899" },
  { category: "Lottery", sales: 2840, percentage: 9.6, color: "#6366f1" },
  { category: "Dairy", sales: 2100, percentage: 7.1, color: "#06b6d4" },
  { category: "Other", sales: 3040, percentage: 10.2, color: "#94a3b8" },
];

interface CustomTooltipProps extends TooltipProps<number, string> {}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as CategoryBreakdown;

  return (
    <div className="bg-slate-900 rounded-xl shadow-xl p-3 border border-slate-700">
      <p className="text-xs font-semibold text-white mb-1">{data.category}</p>
      <p className="text-xs text-slate-300">
        {formatCurrency(data.sales)}
        <span className="text-slate-500 ml-1">({data.percentage.toFixed(1)}%)</span>
      </p>
    </div>
  );
}

interface CategoryBreakdownChartProps {
  data?: CategoryBreakdown[];
  isLoading?: boolean;
}

export function CategoryBreakdownChart({
  data,
  isLoading,
}: CategoryBreakdownChartProps) {
  const chartData = data ?? MOCK_DATA;

  if (isLoading) {
    return (
      <div className="h-64 bg-slate-50 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading chart...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="sales"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="space-y-1.5">
        {chartData.map((item) => (
          <div key={item.category} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-slate-600 flex-1 truncate">
              {item.category}
            </span>
            <span className="text-xs font-medium text-slate-800">
              {item.percentage.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 w-20 text-right">
              {formatCurrency(item.sales)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
