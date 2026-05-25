"use client";

import { Bell, Search } from "lucide-react";
import { StoreSelector } from "./StoreSelector";
import { useAuthStore } from "@/store/authStore";
import { getInitials } from "@/lib/utils";
import { useState } from "react";
import { useLogout } from "@/hooks/useAuth";

export function TopBar() {
  const { user } = useAuthStore();
  const logout = useLogout();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const mockNotifications = [
    {
      id: "1",
      title: "Low stock: Marlboro Red 20pk",
      time: "5 min ago",
      type: "warning",
    },
    {
      id: "2",
      title: "Invoice #4821 ready for review",
      time: "1 hr ago",
      type: "info",
    },
    {
      id: "3",
      title: "Fuel tank Regular below 20%",
      time: "2 hr ago",
      type: "critical",
    },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center gap-4 px-6 flex-shrink-0">
      {/* Store selector */}
      <StoreSelector />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-400 min-w-[200px]">
        <Search size={14} />
        <span>Search...</span>
        <kbd className="ml-auto text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-400">
          ⌘K
        </kbd>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => {
            setNotifOpen(!notifOpen);
            setUserMenuOpen(false);
          }}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {notifOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setNotifOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-20 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-900">
                  Notifications
                </h3>
                <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {mockNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          n.type === "critical"
                            ? "bg-red-500"
                            : n.type === "warning"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm text-slate-800 font-medium">
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {n.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                  View all alerts
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => {
            setUserMenuOpen(!userMenuOpen);
            setNotifOpen(false);
          }}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
            {user ? getInitials(user.firstName, user.lastName) : "U"}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-slate-700 leading-none">
              {user ? `${user.firstName} ${user.lastName}` : "User"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">
              {user?.role.toLowerCase() ?? ""}
            </p>
          </div>
        </button>

        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setUserMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-20 w-52 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user ? `${user.firstName} ${user.lastName}` : "User"}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  Profile settings
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  Billing
                </button>
                <hr className="my-1 border-slate-100" />
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
