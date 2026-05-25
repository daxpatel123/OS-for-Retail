"use client";

import { useState } from "react";
import { ChevronDown, Store, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelectedStore } from "@/hooks/useStore";

export function StoreSelector() {
  const [open, setOpen] = useState(false);
  const { selectedStore, stores, setSelectedStore } = useSelectedStore();

  // Use mock data if no stores loaded
  const mockStores = [
    {
      id: "store-1",
      organizationId: "org-1",
      name: "Main St. Gas & Go",
      address: "123 Main St",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      timezone: "America/Chicago",
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "store-2",
      organizationId: "org-1",
      name: "Elm Ave Fuel Stop",
      address: "456 Elm Ave",
      city: "Springfield",
      state: "IL",
      zip: "62702",
      timezone: "America/Chicago",
      createdAt: "",
      updatedAt: "",
    },
  ];

  const displayStores = stores.length > 0 ? stores : mockStores;
  const currentStore = selectedStore ?? displayStores[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 min-w-[180px] max-w-[260px]"
      >
        <Store size={15} className="text-slate-400 flex-shrink-0" />
        <span className="truncate flex-1 text-left">
          {currentStore?.name ?? "Select store"}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-slate-400 flex-shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full mt-1 left-0 z-20 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden min-w-[220px]">
            <div className="p-2">
              {displayStores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => {
                    setSelectedStore(store);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Store size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {store.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {store.city}, {store.state}
                    </p>
                  </div>
                  {currentStore?.id === store.id && (
                    <Check size={14} className="text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
