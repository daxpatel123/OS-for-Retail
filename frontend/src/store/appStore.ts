import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Store } from "@/types";

interface AppState {
  selectedStore: Store | null;
  stores: Store[];
  sidebarCollapsed: boolean;
  selectedDate: string;

  setSelectedStore: (store: Store) => void;
  setStores: (stores: Store[]) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedDate: (date: string) => void;
}

const today = new Date().toISOString().split("T")[0];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedStore: null,
      stores: [],
      sidebarCollapsed: false,
      selectedDate: today,

      setSelectedStore: (selectedStore) => set({ selectedStore }),

      setStores: (stores) =>
        set((state) => ({
          stores,
          selectedStore: state.selectedStore ?? stores[0] ?? null,
        })),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      setSelectedDate: (selectedDate) => set({ selectedDate }),
    }),
    {
      name: "retailos-app",
      partialize: (state) => ({
        selectedStore: state.selectedStore,
        sidebarCollapsed: state.sidebarCollapsed,
        selectedDate: state.selectedDate,
      }),
    }
  )
);
