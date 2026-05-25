import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { clearTokens } from "@/lib/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) =>
        set({ user, isAuthenticated: true }),

      clearAuth: () => {
        clearTokens();
        set({ user: null, isAuthenticated: false });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "retailos-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
