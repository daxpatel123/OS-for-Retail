"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";
import { useAppStore } from "@/store/appStore";

export function useInventory(params?: {
  search?: string;
  status?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useQuery({
    queryKey: ["inventory", storeId, params],
    queryFn: () => inventoryApi.getInventory(storeId, params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useReorderRecommendations() {
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useQuery({
    queryKey: ["inventory", "reorder", storeId],
    queryFn: () => inventoryApi.getReorderRecommendations(storeId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeadStock() {
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useQuery({
    queryKey: ["inventory", "dead-stock", storeId],
    queryFn: () => inventoryApi.getDeadStock(storeId),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateAdjustment() {
  const queryClient = useQueryClient();
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useMutation({
    mutationFn: (data: {
      productId: string;
      quantity: number;
      reason: string;
      notes?: string;
    }) => inventoryApi.createAdjustment(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", storeId] });
    },
  });
}
