"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SalesTrend } from "@/types";

const MOCK_DATA: SalesTrend[] = [
  {
    date: "2026-05-19",
    totalSales: 18420,
    fuelSales: 12300,
    insideSales: 6120,
  },
  {
    date: "2026-05-20",
    totalSales: 21500,
    fuelSales: 14200,
    insideSales: 7300,
  },
  {
    date: "2026-05-21",
    totalSales: 19800,
    fuelSales: 13100,
    insideSales: 6700,
  },
  {
    date: "2026-05-22",
    totalSales: 23100,
    fuelSales: 15400,
    insideSales: 7700,
  },
  {
    date: "2026-05-23",
    totalSales: 20900,
    fuelSales: 13800,
    insideSales: 7100,
  },
  {
    date: "2026-05-24",
    totalSales: 24600,
    fuelSales: 16200,
    insideSales: 8400,
  },
  {
    date: "2026-05-25",
    totalSales: 22340,
    fuelSales: 14870,
    insideSales: 7470,
  },
];

interface CustomTooltipProps extends TooltipProps<number, string> {}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-slate-900 rounded-xl shadow-xl p-3 border border-slate-700">
      <p className="text-xs font-medium text-slate-400 mb-2">
        {formatDate(label as string, "EEE, MMM d")}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-slate-300 capitalize">{entry.name}:</span>
          <span className="text-xs font-semibold text-white">
            {formatCurrency(entry.value as number)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface SalesTrendChartProps {
  data?: SalesTrend[];
  isLoading?: boolean;
}

export function SalesTrendChart({ data, isLoading }: SalesTrendChartProps) {
  const chartData = data ?? MOCK_DATA;

  if (isLoading) {
    return (
      <div className="h-64 bg-slate-50 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading chart...</p>
      </div>
    );
  }

  const formatted = chartData.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date, "MMM d"),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: "12px" }}
          formatter={(value) => (
            <span className="text-slate-600 capitalize text-xs">{value}</span>
          )}
        />
        <Line
          type="monotone"
          dataKey="totalSales"
          name="Total Sales"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="fuelSales"
          name="Fuel Sales"
          stroke="#f97316"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          strokeDasharray="5 3"
        />
        <Line
          type="monotone"
          dataKey="insideSales"
          name="Inside Sales"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          strokeDasharray="5 3"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
