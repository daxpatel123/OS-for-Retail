"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { useAppStore } from "@/store/appStore";

export function useDashboardSummary(date?: string) {
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useQuery({
    queryKey: ["dashboard", "summary", storeId, date],
    queryFn: () => dashboardApi.getDailySummary(storeId, date),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSalesTrend(days: number = 7) {
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useQuery({
    queryKey: ["dashboard", "sales-trend", storeId, days],
    queryFn: () => dashboardApi.getSalesTrend(storeId, days),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryBreakdown(date?: string) {
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useQuery({
    queryKey: ["dashboard", "category-breakdown", storeId, date],
    queryFn: () => dashboardApi.getCategoryBreakdown(storeId, date),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopProducts(limit: number = 10, date?: string) {
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useQuery({
    queryKey: ["dashboard", "top-products", storeId, limit, date],
    queryFn: () => dashboardApi.getTopProducts(storeId, limit, date),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardAlerts() {
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useQuery({
    queryKey: ["alerts", "dashboard", storeId],
    queryFn: () => dashboardApi.getAlerts(storeId),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
