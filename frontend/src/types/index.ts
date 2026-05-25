// ─── Organization & User Types ───────────────────────────────────────────────

export type UserRole = "OWNER" | "MANAGER" | "EMPLOYEE" | "ACCOUNTANT";

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  storeIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Product & Inventory Types ────────────────────────────────────────────────

export interface ProductCategory {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
}

export interface Vendor {
  id: string;
  organizationId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  accountNumber?: string;
}

export interface Product {
  id: string;
  organizationId: string;
  upc: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: ProductCategory;
  vendorId?: string;
  vendor?: Vendor;
  costPrice: number;
  retailPrice: number;
  taxRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "DEAD_STOCK";

export interface Inventory {
  id: string;
  storeId: string;
  productId: string;
  product?: Product;
  quantityOnHand: number;
  reorderPoint: number;
  reorderQuantity: number;
  daysOfSupply: number;
  lastReceivedAt?: string;
  lastSoldAt?: string;
  status: StockStatus;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  storeId: string;
  productId: string;
  product?: Product;
  movementType: "SALE" | "RECEIPT" | "ADJUSTMENT" | "TRANSFER" | "WASTE";
  quantity: number;
  referenceId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  storeId: string;
  productId: string;
  product?: Product;
  alertType: "LOW_STOCK" | "OUT_OF_STOCK" | "REORDER_NEEDED";
  currentQuantity: number;
  reorderPoint: number;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
}

// ─── Transaction Types ────────────────────────────────────────────────────────

export interface TransactionLineItem {
  id: string;
  transactionId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Shift {
  id: string;
  storeId: string;
  employeeId: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  closingCash?: number;
}

export interface Transaction {
  id: string;
  storeId: string;
  shiftId?: string;
  shift?: Shift;
  transactionType: "SALE" | "REFUND" | "VOID";
  paymentMethod: "CASH" | "CREDIT" | "DEBIT" | "EBT" | "MIXED";
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  lineItems: TransactionLineItem[];
  createdAt: string;
}

// ─── Fuel Types ───────────────────────────────────────────────────────────────

export type FuelGrade = "REGULAR" | "MIDGRADE" | "PREMIUM" | "DIESEL" | "E85";

export interface FuelSale {
  id: string;
  storeId: string;
  grade: FuelGrade;
  gallons: number;
  pricePerGallon: number;
  totalAmount: number;
  pumpNumber: number;
  paymentMethod: "CASH" | "CREDIT" | "DEBIT" | "FLEET";
  saleDate: string;
}

export interface FuelPrice {
  id: string;
  storeId: string;
  grade: FuelGrade;
  retailPrice: number;
  costPrice: number;
  effectiveDate: string;
}

export interface FuelInventory {
  id: string;
  storeId: string;
  grade: FuelGrade;
  tankCapacity: number;
  currentVolume: number;
  lastDeliveryDate?: string;
  lastDeliveryVolume?: number;
}

// ─── Invoice Types ────────────────────────────────────────────────────────────

export type InvoiceStatus =
  | "PENDING"
  | "PROCESSING"
  | "EXTRACTED"
  | "REVIEWED"
  | "APPROVED"
  | "POSTED"
  | "ERROR";

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  upc?: string;
  productId?: string;
  product?: Product;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  matched: boolean;
}

export interface Invoice {
  id: string;
  storeId: string;
  vendorId?: string;
  vendor?: Vendor;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  status: InvoiceStatus;
  totalAmount: number;
  lineItems: InvoiceLineItem[];
  fileUrl?: string;
  fileName?: string;
  ocrConfidence?: number;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Flash Report Types ───────────────────────────────────────────────────────

export interface FlashReportCategory {
  name: string;
  sales: number;
  transactions: number;
}

export interface FlashReport {
  id: string;
  storeId: string;
  reportDate: string;
  totalSales: number;
  fuelSales: number;
  insideSales: number;
  lotterySales: number;
  tobaccoSales: number;
  cashSales: number;
  cardSales: number;
  grossProfit: number;
  grossMargin: number;
  categories: FlashReportCategory[];
  fileUrl?: string;
  fileName?: string;
  parseConfidence: number;
  status: "PENDING" | "PARSED" | "REVIEWED" | "ERROR";
  createdAt: string;
  updatedAt: string;
}

// ─── Alert Types ──────────────────────────────────────────────────────────────

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AlertStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";

export interface Alert {
  id: string;
  storeId: string;
  alertType:
    | "LOW_STOCK"
    | "OUT_OF_STOCK"
    | "PRICE_ANOMALY"
    | "SALES_DROP"
    | "INVOICE_DUE"
    | "FUEL_LOW"
    | "SHRINK_DETECTED"
    | "SYSTEM";
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface DashboardSummary {
  date: string;
  totalSales: number;
  fuelSales: number;
  insideSales: number;
  netMargin: number;
  totalTransactions: number;
  averageTicket: number;
  totalSalesChange: number;
  fuelSalesChange: number;
  insideSalesChange: number;
  netMarginChange: number;
}

export interface SalesTrend {
  date: string;
  totalSales: number;
  fuelSales: number;
  insideSales: number;
}

export interface CategoryBreakdown {
  category: string;
  sales: number;
  percentage: number;
  color: string;
}

export interface TopProduct {
  rank: number;
  productId: string;
  productName: string;
  upc: string;
  category: string;
  unitsSold: number;
  revenue: number;
  margin: number;
}

// ─── AI Assistant Types ───────────────────────────────────────────────────────

export interface AIAssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: string[];
  suggestedActions?: string[];
  isLoading?: boolean;
}

export interface AIAssistantResponse {
  answer: string;
  sources: string[];
  suggestedActions: string[];
  confidence: number;
  queryId: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ─── Reorder & Dead Stock Types ───────────────────────────────────────────────

export interface ReorderRecommendation {
  productId: string;
  product: Product;
  currentQuantity: number;
  reorderPoint: number;
  suggestedQuantity: number;
  estimatedCost: number;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  vendorName?: string;
  lastOrderDate?: string;
}

export interface DeadStockItem {
  productId: string;
  product: Product;
  quantityOnHand: number;
  daysSinceLastSale: number;
  estimatedValue: number;
  recommendation: string;
}
