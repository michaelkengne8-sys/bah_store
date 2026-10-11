export interface Category {
  id: string;
  name: string;
  tagline: string;
  image: string;
  count: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  hoverImage: string;
  rating: number;
  reviews: number;
  badge: string;
  category: string;
  stock: "in_stock" | "low_stock" | "out_of_stock";
  colors: string[];
  brand?: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  name: string;
  role: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  avatar: string;
  product: string;
}

export interface FAQ {
  q: string;
  a: string;
}

export interface SearchSuggestion {
  query: string;
}

// Fuzzy search types
export interface SearchResult<T> {
  item: T;
  score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: string;
  value: string;
  score: number;
}

export interface SearchOptions<T> {
  fields: SearchField<T>[];
  threshold?: number;
  limit?: number;
  fuzzy?: boolean;
  maxEditDistance?: number;
  exactMatchBoost?: number;
  prefixMatchBoost?: number;
}

export interface SearchField<T> {
  name: string;
  getValue: (_item: T) => string;
  weight?: number;
  fuzzy?: boolean;
}

export interface AutocompleteOption {
  text: string;
  type: 'query' | 'product' | 'category' | 'brand';
  productId?: string;
  categoryId?: string;
}

export interface CartItem {
  id: string;
  qty: number;
  color: string;
}

export interface WishlistItem {
  id: string;
}

export interface CompareItem {
  id: string;
}

export interface RecentlyViewedItem {
  id: string;
}

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export interface ModalState {
  type: "quickview" | "confirm" | "alert" | null;
  payload?: unknown;
}

export interface StoreState {
  cart: CartItem[];
  wishlist: WishlistItem[];
  compare: CompareItem[];
  recentlyViewed: RecentlyViewedItem[];
  toasts: Toast[];
  modal: ModalState | null;
  search: string;
  compareOpen: boolean;
  checkoutStep: CheckoutStep;
  shippingAddress: ShippingAddress | null;
  paymentInfo: PaymentInfo | null;
}

export type StoreAction =
  | { type: "ADD_TO_CART"; payload: { id: string; qty?: number; color: string } }
  | { type: "REMOVE_FROM_CART"; payload: { id: string; color: string } }
  | { type: "UPDATE_QTY"; payload: { id: string; color: string; qty: number } }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_WISHLIST"; payload: { id: string } }
  | { type: "TOGGLE_COMPARE"; payload: { id: string } }
  | { type: "CLEAR_COMPARE" }
  | { type: "TOGGLE_COMPARE_DRAWER" }
  | { type: "PUSH_TOAST"; payload: Toast }
  | { type: "DISMISS_TOAST"; payload: { id: number } }
  | { type: "OPEN_MODAL"; payload: ModalState }
  | { type: "CLOSE_MODAL" }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "PUSH_RECENTLY_VIEWED"; payload: { id: string } }
  | { type: "SET_CHECKOUT_STEP"; payload: CheckoutStep }
  | { type: "SET_SHIPPING_ADDRESS"; payload: ShippingAddress }
  | { type: "SET_PAYMENT_INFO"; payload: PaymentInfo }
  | { type: "CLEAR_CHECKOUT" };

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  saveInfo: boolean;
}

export type PaymentMethodType = "cashapp" | "zelle" | "crypto" | "apple_pay";

export interface PaymentInfo {
  method: PaymentMethodType;
  // CashApp
  cashappUsername?: string;
  cashappBusinessName?: string;
  // Zelle
  zelleEmail?: string;
  zellePhone?: string;
  zelleBankName?: string;
  // Crypto
  cryptoNetwork?: string; // bitcoin, ethereum, usdc, usdt
  cryptoWalletAddress?: string;
  // Apple Pay
  applePayToken?: string;
  // Legacy card (for backward compat with existing orders)
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
  nameOnCard?: string;
}

export interface CashoutRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  paymentDetails: PaymentInfo;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  requestedAt: string;
  processedAt?: string;
  transactionId?: string;
  adminNotes?: string;
}

export interface CashoutMethodConfig {
  type: PaymentMethodType;
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
  feePercent: number;
  feeFixed: number;
  processingTime: string; // e.g., "instant", "1-2 business days"
  instructions: string;
  // Method-specific config
  cashappUsername?: string;
  zelleEmail?: string;
  zellePhone?: string;
  cryptoNetworks?: { id: string; name: string; symbol: string; walletAddress: string; minAmount: number; enabled: boolean }[];
  applePayMerchantId?: string;
}

export interface OrderReview {
  shippingAddress: ShippingAddress;
  payment: PaymentInfo;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
}

export type CheckoutStep = "shipping" | "payment" | "review" | "complete";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "user" | "admin";
  createdAt: string;
  lastLoginAt?: string;
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum";
  loyaltyPoints: number;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
}

export interface SessionInfo {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "AUTH_UPDATE_PROFILE"; payload: Partial<User> }
  | { type: "AUTH_HYDRATE"; payload: { user: User; token: string } | null }
  | { type: "AUTH_CLEAR_ERROR" };

export interface AuthContextValue {
  state: AuthState;
  login: (_email: string, _password: string, _rememberMe?: boolean) => Promise<void>;
  googleSignIn: (_idToken: string) => Promise<void>;
  appleSignIn: (_idToken: string) => Promise<void>;
  register: (_name: string, _email: string, _password: string) => Promise<{ user: User; verified: boolean; message: string } | void>;
  verifyOtp: (_email: string, _otp: string) => Promise<void>;
  verifyEmailLink: (_token: string) => Promise<void>;
  resendOtp: (_email: string) => Promise<void>;
  logout: () => void;
  updateProfile: (_data: Partial<User>) => Promise<void>;
  changePassword: (_currentPassword: string, _newPassword: string) => Promise<void>;
  forgotPassword: (_email: string) => Promise<void>;
  resetPassword: (_token: string, _newPassword: string) => Promise<void>;
  getSessions: () => Promise<SessionInfo[]>;
  revokeSession: (_sessionId: string) => Promise<void>;
  revokeAllOtherSessions: () => Promise<void>;
  clearError: () => void;
  hydrated: boolean;
}

import type { Dispatch } from "react";

export interface StoreContextValue {
  state: StoreState;
  dispatch: Dispatch<StoreAction>;
  addToCart: (_id: string, _qty?: number, _color?: string) => void;
  pushToast: (_message: string, _type?: Toast["type"]) => void;
  hydrated: boolean;
  checkoutStep: CheckoutStep;
  setCheckoutStep: (_step: CheckoutStep) => void;
  shippingAddress: ShippingAddress | null;
  setShippingAddress: (_addr: ShippingAddress) => void;
  paymentInfo: PaymentInfo | null;
  setPaymentInfo: (_info: PaymentInfo) => void;
  clearCheckout: () => void;
}

// Admin Types
export interface AdminProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  hoverImage: string;
  rating: number;
  reviews: number;
  badge: string;
  category: string;
  stock: "in_stock" | "low_stock" | "out_of_stock";
  colors: string[];
  brand?: string;
  // SEO Fields
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  slug: string;
  // Variants
  variants: ProductVariant[];
  // Inventory
  sku: string;
  weight?: number;
  dimensions?: { width: number; height: number; depth: number };
  // Status
  status: "draft" | "published" | "archived";
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  color: string;
  colorName: string;
  size?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  images: string[];
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  productCount: number;
  seoTitle: string;
  seoDescription: string;
  parentId?: string;
  status: "active" | "inactive";
  sortOrder: number;
  // Category-specific product fields
  productFields: CategoryProductField[];
}

export interface CategoryProductField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "color" | "image" | "boolean" | "array";
  required: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  helpText?: string;
  dependsOn?: string; // Show only when another field has value
  showInCategory: string[]; // Category IDs where this field shows
}

export interface AdminActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entity: "product" | "category" | "order" | "user" | "settings";
  entityId: string;
  entityName: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: "info" | "warning" | "error" | "success";
}

export interface AdminStats {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: number;
  lowStockProducts: number;
  draftProducts: number;
  publishedProducts: number;
  topCategories: { category: string; count: number; revenue: number }[];
  recentActivity: AdminActivity[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "user" | "admin";
  status: "active" | "inactive" | "banned";
  createdAt: string;
  lastLoginAt?: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum";
  loyaltyPoints: number;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  addresses: AdminAddress[];
  tags: string[];
  notes?: string;
}

export interface AdminAddress {
  type: "default" | "billing" | "shipping" | "work";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface AdminOrder {
  id: string;
  orderNumber?: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  paymentStatus: "pending" | "paid" | "partially_refunded" | "refunded" | "failed";
  fulfillmentStatus: "unfulfilled" | "partial" | "fulfilled";
  items: AdminOrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  shippingAddress: AdminAddress;
  billingAddress: AdminAddress;
  paymentMethod: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  timeline?: AdminOrderTimelineEvent[];
}

export interface AdminOrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  variantId?: string;
  variantSku?: string;
  variantTitle?: string;
  variantColor?: string;
  variantSize?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface AdminOrderTimelineEvent {
  id: string;
  type: "created" | "payment" | "fulfillment" | "shipping" | "note" | "status_change";
  title: string;
  description?: string;
  timestamp: string;
  user?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentMethodConfig {
  enabled: boolean;
  testMode?: boolean;
  // Stripe
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  // PayPal
  paypalClientId?: string;
  paypalSecret?: string;
  // CashApp
  cashappUsername?: string;
  cashappBusinessName?: string;
  // Zelle
  zelleEmail?: string;
  zellePhone?: string;
  zelleBankName?: string;
  // Crypto
  cryptoNetworks?: { id: string; name: string; symbol: string; enabled: boolean; walletAddress?: string; contractAddress?: string; decimals?: number }[];
  cryptoWalletAddresses?: Record<string, string>;
  // Apple Pay
  applePayMerchantId?: string;
  applePayCertificate?: string;
}

// Admin Settings - unified definition with new payment methods
export interface AdminSettings {
  general: {
    storeName: string;
    contactEmail: string;
    currency: string;
    timezone: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    ogImage: string;
    robotsTxt: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
    fromName: string;
    templates: {
      orderConfirmation: string;
      shippingConfirmation: string;
      passwordReset: string;
    };
  };
  payments: {
    stripe: PaymentMethodConfig & { type: "stripe" };
    paypal: PaymentMethodConfig & { type: "paypal" };
    cashapp: PaymentMethodConfig & { type: "cashapp" };
    zelle: PaymentMethodConfig & { type: "zelle" };
    crypto: PaymentMethodConfig & { type: "crypto" };
    apple_pay: PaymentMethodConfig & { type: "apple_pay" };
  };
  shipping: {
    freeShippingThreshold: number;
    defaultRate: number;
    zones: ShippingZone[];
  };
  tax: {
    pricesIncludeTax: boolean;
    rates: TaxRate[];
  };
  notifications: {
    newOrderEmail: boolean;
    lowStockEmail: boolean;
    lowStockThreshold: number;
    newUserEmail: boolean;
    adminEmails: string[];
  };
  integrations: {
    gaMeasurementId: string;
    fbPixelId: string;
    tiktokPixelId: string;
    webhookUrl: string;
  };
}

export interface SEOAnalysis {
  score: number;
  issues: SEOIssue[];
  suggestions: string[];
}

export interface SEOIssue {
  field: string;
  severity: "error" | "warning" | "info";
  message: string;
  recommendation: string;
}

// Admin Customers
export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "user" | "admin";
  status: "active" | "inactive" | "banned";
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum";
  loyaltyPoints: number;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  addresses: AdminAddress[];
  tags: string[];
  notes?: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  rate: number;
  freeShippingThreshold?: number;
}

export interface TaxRate {
  id: string;
  country: string;
  state?: string;
  rate: number;
  name: string;
}