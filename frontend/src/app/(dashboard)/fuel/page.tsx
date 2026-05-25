"use client";

import { FuelDashboard } from "@/components/fuel/FuelDashboard";

export default function FuelPage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Fuel</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Tank levels, pricing, and fuel sales analytics
        </p>
      </div>
      <FuelDashboard />
    </div>
  );
}
