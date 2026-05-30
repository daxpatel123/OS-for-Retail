import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Store } from "@/types";

interface AppState {
  selectedStore: Store | null;
  stores: Store[];
  setSelectedStore: (store: Store) => void;
  setStores: (stores: Store[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedStore: null,
      stores: [],
      setSelectedStore: (store) => set({ selectedStore: store }),
      setStores: (stores) => set({ stores }),
    }),
    { name: "retailos-app" }
  )
);
