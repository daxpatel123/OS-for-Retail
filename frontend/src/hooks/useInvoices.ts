"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi, flashReportsApi } from "@/lib/api";
import { useAppStore } from "@/store/appStore";
import type { InvoiceStatus } from "@/types";

export function useInvoices(params?: {
  status?: InvoiceStatus;
  vendorId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useQuery({
    queryKey: ["invoices", storeId, params],
    queryFn: () => invoicesApi.getInvoices(storeId, params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useInvoice(invoiceId: string) {
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useQuery({
    queryKey: ["invoices", storeId, invoiceId],
    queryFn: () => invoicesApi.getInvoice(storeId, invoiceId),
    enabled: !!invoiceId,
  });
}

export function useUploadInvoice() {
  const queryClient = useQueryClient();
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useMutation({
    mutationFn: ({ file, vendorId }: { file: File; vendorId?: string }) =>
      invoicesApi.uploadInvoice(storeId, file, vendorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", storeId] });
    },
  });
}

export function useApproveInvoice() {
  const queryClient = useQueryClient();
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useMutation({
    mutationFn: (invoiceId: string) =>
      invoicesApi.approveInvoice(storeId, invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", storeId] });
    },
  });
}

export function useFlashReports(params?: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}) {
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useQuery({
    queryKey: ["flash-reports", storeId, params],
    queryFn: () => flashReportsApi.getFlashReports(storeId, params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUploadFlashReport() {
  const queryClient = useQueryClient();
  const { selectedStore } = useAppStore();
  const storeId = selectedStore?.id ?? "store-1";

  return useMutation({
    mutationFn: (file: File) =>
      flashReportsApi.uploadFlashReport(storeId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flash-reports", storeId] });
    },
  });
}
