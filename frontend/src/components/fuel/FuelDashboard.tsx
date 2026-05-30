"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Fuel, TrendingUp, TrendingDown, Droplets } from "lucide-react";
import { formatCurrency, formatGallons } from "@/lib/utils";
import type { FuelGrade } from "@/types";

interface FuelGradeData {
  grade: FuelGrade;
  label: string;
  color: string;
  tankCapacity: number;
  currentVolume: number;
  retailPrice: number;
  costPrice: number;
  gallonsSoldToday: number;
  revenueToday: number;
  priceChange: number;
}

const FUEL_DATA: FuelGradeData[] = [
  {
    grade: "REGULAR",
    label: "Regular",
    color: "#3b82f6",
    tankCapacity: 12000,
    currentVolume: 2160,
    retailPrice: 3.499,
    costPrice: 3.21,
    gallonsSoldToday: 1842,
    revenueToday: 6445.36,
    priceChange: -0.05,
  },
  {
    grade: "MIDGRADE",
    label: "Mid-Grade",
    color: "#f97316",
    tankCapacity: 8000,
    currentVolume: 4200,
    retailPrice: 3.799,
    costPrice: 3.49,
    gallonsSoldToday: 482,
    revenueToday: 1831.22,
    priceChange: 0.0,
  },
  {
    grade: "PREMIUM",
    label: "Premium",
    color: "#8b5cf6",
    tankCapacity: 8000,
    currentVolume: 5600,
    retailPrice: 4.099,
    costPrice: 3.78,
    gallonsSoldToday: 628,
    revenueToday: 2574.17,
    priceChange: 0.1,
  },
  {
    grade: "DIESEL",
    label: "Diesel",
    color: "#10b981",
    tankCapacity: 10000,
    currentVolume: 6800,
    retailPrice: 3.899,
    costPrice: 3.58,
    gallonsSoldToday: 980,
    revenueToday: 3821.02,
    priceChange: -0.03,
  },
];

const HOURLY_SALES = [
  { hour: "6am", gallons: 180, revenue: 630 },
  { hour: "7am", gallons: 340, revenue: 1190 },
  { hour: "8am", gallons: 420, revenue: 1470 },
  { hour: "9am", gallons: 280, revenue: 980 },
  { hour: "10am", gallons: 220, revenue: 770 },
  { hour: "11am", gallons: 310, revenue: 1085 },
  { hour: "12pm", gallons: 480, revenue: 1680 },
  { hour: "1pm", gallons: 390, revenue: 1365 },
  { hour: "2pm", gallons: 260, revenue: 910 },
  { hour: "3pm", gallons: 350, revenue: 1225 },
  { hour: "4pm", gallons: 510, revenue: 1785 },
  { hour: "5pm", gallons: 480, revenue: 1680 },
  { hour: "6pm", gallons: 380, revenue: 1330 },
  { hour: "7pm", gallons: 290, revenue: 1015 },
  { hour: "8pm", gallons: 200, revenue: 700 },
];

function TankGauge({
  grade,
  currentVolume,
  tankCapacity,
  color,
}: {
  grade: string;
  currentVolume: number;
  tankCapacity: number;
  color: string;
}) {
  const pct = (currentVolume / tankCapacity) * 100;
  const isCritical = pct < 20;
  const isLow = pct < 35;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-12 h-24 border-2 border-slate-200 rounded-lg overflow-hidden bg-slate-50">
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-500"
          style={{
            height: `${pct}%`,
            backgroundColor: isCritical
              ? "#ef4444"
              : isLow
              ? "#f59e0b"
              : color,
            opacity: 0.85,
          }}
        />
        {/* Gauge lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-1.5">
          {[75, 50, 25].map((p) => (
            <div
              key={p}
              className="w-full border-t border-slate-200/50 border-dashed"
            />
          ))}
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-600">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

export function FuelDashboard() {
  const totalGallons = FUEL_DATA.reduce((s, f) => s + f.gallonsSoldToday, 0);
  const totalRevenue = FUEL_DATA.reduce((s, f) => s + f.revenueToday, 0);
  const avgMargin =
    FUEL_DATA.reduce(
      (s, f) => s + ((f.retailPrice - f.costPrice) / f.retailPrice) * 100,
      0
    ) / FUEL_DATA.length;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Gallons Sold Today",
            value: formatGallons(totalGallons),
            icon: Fuel,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Fuel Revenue",
            value: formatCurrency(totalRevenue),
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Avg Fuel Margin",
            value: `${avgMargin.toFixed(1)}%`,
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Low Tank Alert",
            value: "1 Grade",
            icon: Droplets,
            color: "text-red-600",
            bg: "bg-red-50",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-100 p-4 flex items-start gap-3"
            >
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tank levels + pricing */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          Tank Levels & Pricing
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FUEL_DATA.map((fuel) => {
            const pct = (fuel.currentVolume / fuel.tankCapacity) * 100;
            const isCritical = pct < 20;
            const isLow = pct < 35;
            const margin =
              ((fuel.retailPrice - fuel.costPrice) / fuel.retailPrice) * 100;

            return (
              <div
                key={fuel.grade}
                className={`p-4 rounded-xl border ${
                  isCritical
                    ? "border-red-200 bg-red-50"
                    : isLow
                    ? "border-amber-100 bg-amber-50/50"
                    : "border-slate-100 bg-slate-50/50"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {fuel.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatGallons(fuel.currentVolume)} /{" "}
                      {formatGallons(fuel.tankCapacity)}
                    </p>
                  </div>
                  <TankGauge
                    grade={fuel.grade}
                    currentVolume={fuel.currentVolume}
                    tankCapacity={fuel.tankCapacity}
                    color={fuel.color}
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Retail</span>
                    <span className="font-bold text-slate-800">
                      ${fuel.retailPrice.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Cost</span>
                    <span className="text-slate-600">
                      ${fuel.costPrice.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Margin</span>
                    <span className="font-semibold text-emerald-600">
                      {margin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Price change</span>
                    <span
                      className={`font-semibold flex items-center gap-0.5 ${
                        fuel.priceChange > 0
                          ? "text-red-500"
                          : fuel.priceChange < 0
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }`}
                    >
                      {fuel.priceChange > 0 ? (
                        <TrendingUp size={10} />
                      ) : fuel.priceChange < 0 ? (
                        <TrendingDown size={10} />
                      ) : null}
                      {fuel.priceChange === 0
                        ? "No change"
                        : `${fuel.priceChange > 0 ? "+" : ""}${fuel.priceChange.toFixed(3)}`}
                    </span>
                  </div>
                </div>

                {isCritical && (
                  <div className="mt-2 p-1.5 bg-red-100 rounded text-xs text-red-700 font-medium text-center">
                    Order delivery now
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hourly sales chart */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          Hourly Fuel Sales — Today
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={HOURLY_SALES}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${v}`}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                background: "#1e293b",
                border: "none",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#f8fafc",
              }}
              formatter={(value: number, name: string) => [
                name === "gallons"
                  ? formatGallons(value)
                  : formatCurrency(value),
                name === "gallons" ? "Gallons" : "Revenue",
              ]}
            />
            <Bar dataKey="gallons" fill="#3b82f6" radius={[4, 4, 0, 0]}>
              {HOURLY_SALES.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 12 ? "#1d4ed8" : "#3b82f6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Today's breakdown table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">
            Today&apos;s Fuel Breakdown
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-2.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Grade
              </th>
              <th className="text-right py-2.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Gallons
              </th>
              <th className="text-right py-2.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Revenue
              </th>
              <th className="text-right py-2.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Retail Price
              </th>
              <th className="text-right py-2.5 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Margin
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {FUEL_DATA.map((fuel) => {
              const margin =
                ((fuel.retailPrice - fuel.costPrice) / fuel.retailPrice) * 100;
              return (
                <tr
                  key={fuel.grade}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: fuel.color }}
                      />
                      <span className="font-medium text-slate-800">
                        {fuel.label}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-right tabular-nums text-slate-600">
                    {formatGallons(fuel.gallonsSoldToday)}
                  </td>
                  <td className="py-3 px-5 text-right tabular-nums font-medium text-slate-800">
                    {formatCurrency(fuel.revenueToday)}
                  </td>
                  <td className="py-3 px-5 text-right tabular-nums text-slate-600">
                    ${fuel.retailPrice.toFixed(3)}
                  </td>
                  <td className="py-3 px-5 text-right tabular-nums">
                    <span className="text-emerald-600 font-semibold">
                      {margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-slate-100">
            <tr>
              <td className="py-2.5 px-5 font-semibold text-slate-700">
                Total
              </td>
              <td className="py-2.5 px-5 text-right tabular-nums font-semibold text-slate-700">
                {formatGallons(totalGallons)}
              </td>
              <td className="py-2.5 px-5 text-right tabular-nums font-bold text-slate-900">
                {formatCurrency(totalRevenue)}
              </td>
              <td />
              <td className="py-2.5 px-5 text-right font-semibold text-emerald-600">
                {avgMargin.toFixed(1)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
