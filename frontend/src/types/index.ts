export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  isActive: boolean;
}

export interface Store {
  id: string;
  orgId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  timezone: string;
  posType: string;
  isActive: boolean;
}

export type UserRole = "OWNER" | "MANAGER" | "EMPLOYEE" | "ACCOUNTANT";

export interface User {
  id: string;
  orgId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  parentId?: string;
  marginTargetPct?: number;
}

export interface Vendor {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  accountNumber?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  upc?: string;
  plu?: string;
  name: string;
  categoryId?: string;
  vendorId?: string;
  cost: number;
  retailPrice: number;
  unitOfMeasure: string;
  isActive: boolean;
  reorderPoint?: number;
  reorderQuantity?: number;
  minStock?: number;
  maxStock?: number;
}

export interface Inventory {
  id: string;
  storeId: string;
  productId: string;
  product: Product;
  quantityOnHand: number;
  lastCountedAt?: string;
  lastUpdatedAt: string;
}

export type StockStatus =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "DEAD_STOCK";

export interface StockAlert {
  id: string;
  storeId: string;
  productId: string;
  product: Product;
  alertType: "LOW_STOCK" | "OUT_OF_STOCK" | "OVERSTOCK" | "DEAD_STOCK";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  triggeredAt: string;
}

export interface InventoryMovement {
  id: string;
  storeId: string;
  productId: string;
  movementType: "SALE" | "RECEIPT" | "ADJUSTMENT" | "TRANSFER" | "WASTE";
  quantity: number;
  notes?: string;
  createdAt: string;
}

export type InvoiceStatus =
  | "PENDING"
  | "MATCHED"
  | "DISCREPANCY"
  | "APPROVED"
  | "PAID";

export type OcrStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  productNameRaw: string;
  upcRaw?: string;
  quantityOrdered: number;
  quantityDelivered: number;
  unitCost: number;
  lineTotal: number;
  matchConfidence?: number;
  hasDiscrepancy: boolean;
  discrepancyNotes?: string;
}

export interface Invoice {
  id: string;
  storeId: string;
  vendorId?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  ocrStatus: OcrStatus;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  status: InvoiceStatus;
  lineItems?: InvoiceLineItem[];
  createdAt: string;
}

export type FlashReportStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface FlashReportCategory {
  id: string;
  categoryName: string;
  salesAmount: number;
  transactionCount?: number;
}

export interface FlashReport {
  id: string;
  storeId: string;
  reportDate: string;
  parseStatus: FlashReportStatus;
  parseConfidence?: number;
  totalSales?: number;
  fuelSalesAmount?: number;
  fuelGallons?: number;
  insideSales?: number;
  lotterySales?: number;
  tobaccoSales?: number;
  taxCollected?: number;
  cashSales?: number;
  cardSales?: number;
  refunds?: number;
  voids?: number;
  transactionCount?: number;
  categories?: FlashReportCategory[];
  createdAt: string;
}

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
export type AlertType =
  | "LOW_STOCK"
  | "SHRINKAGE"
  | "INVOICE_DISCREPANCY"
  | "UNUSUAL_REFUND"
  | "CASH_SHORT"
  | "FUEL_LOW"
  | "PRICE_MARGIN_EROSION";

export interface Alert {
  id: string;
  orgId: string;
  storeId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  createdAt: string;
}

export interface DashboardSummary {
  date: string;
  totalSales: number;
  fuelSales: number;
  insideSales: number;
  grossMargin: number;
  grossMarginPct: number;
  transactionCount: number;
  avgTransactionValue: number;
  cashSales: number;
  cardSales: number;
  refunds: number;
}

export interface SalesTrendPoint {
  date: string;
  totalSales: number;
  fuelSales: number;
  insideSales: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  category: string;
  totalRevenue: number;
  unitsSold: number;
}

export interface CategoryBreakdownItem {
  category: string;
  salesAmount: number;
  pct: number;
}

export interface ReorderRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  vendorName?: string;
  estimatedCost?: number;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM";
}

export interface AIAssistantResponse {
  answer: string;
  dataSources: string[];
  suggestedActions: string[];
  confidence: number;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  orgName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
