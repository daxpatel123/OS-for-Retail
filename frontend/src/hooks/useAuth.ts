"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { storeAuthResponse, clearTokens } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import type { LoginRequest, RegisterRequest } from "@/types";

export function useLogin() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      storeAuthResponse(response);
      setUser(response.user);
      router.push("/dashboard");
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      storeAuthResponse(response);
      setUser(response.user);
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  return () => {
    clearTokens();
    clearAuth();
    router.push("/login");
  };
}
