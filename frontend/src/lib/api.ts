import axios from "axios";
import { getToken, clearToken } from "./auth";
import type {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
  DashboardSummary,
  SalesTrendPoint,
  TopProduct,
  CategoryBreakdownItem,
  Inventory,
  ReorderRecommendation,
  Invoice,
  FlashReport,
  Alert,
  AIAssistantResponse,
} from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: { status?: number } }).response?.status === "number" &&
      (error as { response: { status: number } }).response.status === 401
    ) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const login = (data: LoginRequest): Promise<AuthTokens> =>
  api.post<AuthTokens>("/auth/login", data).then((r) => r.data);

export const register = (data: RegisterRequest): Promise<AuthTokens> =>
  api.post<AuthTokens>("/auth/register", data).then((r) => r.data);

export const getMe = (): Promise<User> =>
  api.get<User>("/auth/me").then((r) => r.data);

// Dashboard
export const getDailySummary = (
  storeId: string,
  date: string
): Promise<DashboardSummary> =>
  api
    .get<DashboardSummary>("/dashboard/summary", {
      params: { store_id: storeId, date },
    })
    .then((r) => r.data);

export const getSalesTrend = (
  storeId: string,
  days = 7
): Promise<SalesTrendPoint[]> =>
  api
    .get<SalesTrendPoint[]>("/dashboard/sales-trend", {
      params: { store_id: storeId, days },
    })
    .then((r) => r.data);

export const getTopProducts = (
  storeId: string,
  days = 7
): Promise<TopProduct[]> =>
  api
    .get<TopProduct[]>("/dashboard/top-products", {
      params: { store_id: storeId, days },
    })
    .then((r) => r.data);

export const getCategoryBreakdown = (
  storeId: string,
  days = 7
): Promise<CategoryBreakdownItem[]> =>
  api
    .get<CategoryBreakdownItem[]>("/dashboard/category-breakdown", {
      params: { store_id: storeId, days },
    })
    .then((r) => r.data);

// Inventory
export const getInventory = (storeId: string): Promise<Inventory[]> =>
  api
    .get<Inventory[]>("/inventory", { params: { store_id: storeId } })
    .then((r) => r.data);

export const getReorderRecommendations = (
  storeId: string
): Promise<ReorderRecommendation[]> =>
  api
    .get<ReorderRecommendation[]>("/inventory/reorder-recommendations", {
      params: { store_id: storeId },
    })
    .then((r) => r.data);

// Invoices
export const getInvoices = (storeId: string): Promise<Invoice[]> =>
  api
    .get<Invoice[]>("/invoices", { params: { store_id: storeId } })
    .then((r) => r.data);

export const uploadInvoice = (
  storeId: string,
  file: File
): Promise<Invoice> => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("store_id", storeId);
  return api
    .post<Invoice>("/invoices/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

// Flash Reports
export const getFlashReports = (storeId: string): Promise<FlashReport[]> =>
  api
    .get<FlashReport[]>("/flash-reports", { params: { store_id: storeId } })
    .then((r) => r.data);

export const uploadFlashReport = (
  storeId: string,
  file: File
): Promise<FlashReport> => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("store_id", storeId);
  return api
    .post<FlashReport>("/flash-reports/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

// Alerts
export const getAlerts = (
  storeId: string,
  status?: string
): Promise<Alert[]> =>
  api
    .get<Alert[]>("/alerts", { params: { store_id: storeId, status } })
    .then((r) => r.data);

// AI Assistant
export const askAssistant = (
  question: string,
  storeId: string
): Promise<AIAssistantResponse> =>
  api
    .post<AIAssistantResponse>("/assistant/ask", {
      question,
      store_id: storeId,
    })
    .then((r) => r.data);
