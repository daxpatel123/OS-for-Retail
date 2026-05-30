"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface FuelGrade {
  grade: string;
  retailPrice: number;
  costPrice: number;
  margin: number;
  tankCapacity: number;
  tankLevel: number;
  dailyRevenue: number;
}

interface DailyFuelData {
  day: string;
  gallons: number;
}

const fuelGrades: FuelGrade[] = [
  {
    grade: "Regular (87)",
    retailPrice: 3.589,
    costPrice: 3.12,
    margin: 0.469,
    tankCapacity: 10000,
    tankLevel: 6200,
    dailyRevenue: 8420,
  },
  {
    grade: "Mid (89)",
    retailPrice: 3.789,
    costPrice: 3.32,
    margin: 0.469,
    tankCapacity: 8000,
    tankLevel: 4100,
    dailyRevenue: 2180,
  },
  {
    grade: "Premium (93)",
    retailPrice: 4.089,
    costPrice: 3.60,
    margin: 0.489,
    tankCapacity: 6000,
    tankLevel: 3800,
    dailyRevenue: 1640,
  },
  {
    grade: "Diesel",
    retailPrice: 3.999,
    costPrice: 3.54,
    margin: 0.459,
    tankCapacity: 12000,
    tankLevel: 9100,
    dailyRevenue: 2860,
  },
];

const dailyGallons: DailyFuelData[] = [
  { day: "May 24", gallons: 3450 },
  { day: "May 25", gallons: 4120 },
  { day: "May 26", gallons: 3680 },
  { day: "May 27", gallons: 4440 },
  { day: "May 28", gallons: 3290 },
  { day: "May 29", gallons: 4800 },
  { day: "May 30", gallons: 4210 },
];

function TankLevelBar({ level, capacity }: { level: number; capacity: number }) {
  const pct = Math.min(100, (level / capacity) * 100);
  const color = pct < 20 ? "bg-red-500" : pct < 40 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 w-12 text-right">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

export function FuelDashboard() {
  return (
    <div className="space-y-6">
      {/* Grades table */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Grades</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Grade
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Retail
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Cost
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Margin
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[160px]">
                    Tank Level
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Today&apos;s Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fuelGrades.map((grade) => (
                  <tr key={grade.grade} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {grade.grade}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      ${grade.retailPrice.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      ${grade.costPrice.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                      ${grade.margin.toFixed(3)}
                    </td>
                    <td className="py-3 px-4">
                      <TankLevelBar
                        level={grade.tankLevel}
                        capacity={grade.tankCapacity}
                      />
                      <p className="text-xs text-slate-400 mt-0.5">
                        {grade.tankLevel.toLocaleString()} / {grade.tankCapacity.toLocaleString()} gal
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {formatCurrency(grade.dailyRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Daily gallons chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Gallons Sold — Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={dailyGallons}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toLocaleString()} gal`,
                  "Gallons",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="gallons" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
