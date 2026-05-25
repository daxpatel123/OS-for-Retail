"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import api from "@/lib/api";
import { useAppStore } from "@/store/appStore";
import type { Store } from "@/types";

export function useStores() {
  const { setStores } = useAppStore();

  const query = useQuery({
    queryKey: ["stores"],
    queryFn: () =>
      api.get<Store[]>("/stores").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setStores(query.data);
    }
  }, [query.data, setStores]);

  return query;
}

export function useSelectedStore() {
  const { selectedStore, setSelectedStore, stores } = useAppStore();
  return { selectedStore, setSelectedStore, stores };
}
