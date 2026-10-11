import { API_BASE } from "./config";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tse-auth-token");
}

async function apiGet<T>(path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  lowStockProducts: number;
  recentProducts: Array<{
    id: string;
    title: string;
    price: number;
    images: string;
    stock: string;
    createdAt: string;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: string;
    createdAt: string;
    user: { name: string; email: string };
  }>;
  categories: Array<{ id: string; name: string; count: number; revenue: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  productCount?: number;
  seoTitle?: string;
  seoDescription?: string;
  status?: string;
  sortOrder?: number;
  productFields?: Array<{
    key: string;
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    helpText?: string;
    options?: Array<{ value: string; label: string }>;
    showInCategory?: string[];
  }>;
  _count?: { products: number };
}

export const adminApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    return apiGet<DashboardStats>("/dashboard");
  },

  async getProducts(page = 1, limit = 20) {
    return apiGet(`/products?page=${page}&limit=${limit}`);
  },

  async getCategories(): Promise<{ data: Category[]; pagination: { total: number } }> {
    return apiGet("/categories");
  },

  async createCategory(payload: Partial<Category>) {
    return apiRequest(`/categories`, { method: "POST", body: JSON.stringify(payload) });
  },

  async updateCategory(id: string, payload: Partial<Category>) {
    return apiRequest(`/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },

  async deleteCategory(id: string) {
    return apiRequest(`/categories/${id}`, { method: "DELETE" });
  },

  async getOrders(page = 1, limit = 20) {
    return apiGet(`/orders?page=${page}&limit=${limit}`);
  },

  async getOrderStats() {
    return apiGet("/orders/stats");
  },

  async getUsers(page = 1, limit = 20) {
    return apiGet(`/users?page=${page}&limit=${limit}`);
  },

  async getUser(id: string) {
    return apiGet(`/users/${id}`);
  },
};
