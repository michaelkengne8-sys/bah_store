import type { Product } from "../types";
import { products as seedProducts, DATA_VERSION } from "../data/mockData";
import { PRODUCTS_BASE } from "./config";

const STORAGE_KEY = "tse-products-store";
const VERSION_KEY = "tse-products-version";

function isStaleCache(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(VERSION_KEY) !== String(DATA_VERSION);
  } catch {
    return true;
  }
}

function clearCache() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VERSION_KEY);
  } catch {
    // ignore
  }
}

function readStoredProducts(): Product[] {
  if (typeof window === "undefined") return [];
  if (isStaleCache()) {
    clearCache();
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeVersion() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
  } catch {
    // ignore
  }
}

function persistProducts(nextProducts: Product[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProducts));
    writeVersion();
  } catch {
    // ignore storage issues
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiProduct(product: any): Product {
  return {
    id: product.id || product.slug || `p${Date.now()}`,
    title: product.title,
    description: product.description,
    price: Number(product.price || 0),
    originalPrice: Number(product.originalPrice ?? product.price ?? 0),
    image: product.images?.[0] || product.image || seedProducts[0]?.image || "",
    hoverImage: product.hoverImages?.[0] || product.hoverImage || product.images?.[0] || seedProducts[0]?.hoverImage || "",
    rating: Number(product.rating || 4.5),
    reviews: Number(product.reviewsCount || product.reviews || 0),
    badge: product.badge || "New",
    category: product.categoryId || product.category || "lifestyle",
    stock: (product.stock || "IN_STOCK").toLowerCase() === "low_stock"
      ? "low_stock"
      : (product.stock || "IN_STOCK").toLowerCase() === "out_of_stock"
        ? "out_of_stock"
        : "in_stock",
    colors: Array.isArray(product.colors) && product.colors.length > 0 ? product.colors : ["#0a0a0a"],
    brand: product.brand || "Top Shelf",
  };
}

function mapToApiPayload(product: Partial<Product> & { category?: string; slug?: string; seoTitle?: string; seoDescription?: string; seoKeywords?: string[]; sku?: string; weight?: number; dimensions?: { width?: number; height?: number; depth?: number }; status?: string; featured?: boolean; createdAt?: string; updatedAt?: string; }) {
  const image = product.image || seedProducts[0]?.image || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80";
  const hoverImage = product.hoverImage || image;

  return {
    title: product.title,
    description: product.description,
    price: Number(product.price || 0),
    originalPrice: Number(product.originalPrice ?? product.price ?? 0),
    images: [image].filter(Boolean),
    hoverImages: [hoverImage].filter(Boolean),
    categoryId: product.category || "audio",
    stock: (product.stock || "in_stock").toUpperCase().replace(/-/g, "_"),
    colors: product.colors || ["#0a0a0a"],
    brand: product.brand || "Top Shelf",
    badge: product.badge || (product.featured ? "New" : "Best Seller"),
    seoTitle: product.seoTitle || product.title,
    seoDescription: product.seoDescription || product.description,
    seoKeywords: (product.seoKeywords || []).join(","),
  };
}

export let products: Product[] = readStoredProducts().length > 0 ? readStoredProducts() : [...seedProducts];

export async function hydrateProducts() {
  if (typeof window === "undefined") {
    products = [...seedProducts];
    return products;
  }

  const stored = readStoredProducts();
  if (stored.length > 0) {
    products = stored;
    return products;
  }

  try {
    const response = await fetch(PRODUCTS_BASE, { headers: { 'x-dev-admin': 'true' } });
    if (!response.ok) throw new Error("Failed to fetch products");
    const payload = await response.json();
    const nextProducts = (payload.data || payload).map(mapApiProduct);
    if (nextProducts.length > 0) {
      products = nextProducts;
      persistProducts(products);
      return products;
    }
  } catch {
    // fall back to seeded products
  }

  products = [...seedProducts];
  persistProducts(products);
  return products;
}

export async function createProduct(product: Partial<Product> & { category?: string; slug?: string; seoTitle?: string; seoDescription?: string; seoKeywords?: string[]; sku?: string; weight?: number; dimensions?: { width?: number; height?: number; depth?: number }; status?: string; featured?: boolean; createdAt?: string; updatedAt?: string }) {
  const fallbackProduct = {
    id: product.id || `p${Date.now()}`,
    title: product.title || "New Product",
    description: product.description || "Freshly added from the admin dashboard.",
    price: Number(product.price || 0),
    originalPrice: Number(product.originalPrice ?? product.price ?? 0),
    image: product.image || seedProducts[0]?.image || "",
    hoverImage: product.hoverImage || product.image || seedProducts[0]?.hoverImage || "",
    rating: 4.5,
    reviews: 0,
    badge: product.badge || "New",
    category: product.category || "lifestyle",
    stock: product.stock || "in_stock",
    colors: product.colors || ["#0a0a0a"],
    brand: product.brand || "Top Shelf",
    seoTitle: product.seoTitle || product.title || "New Product",
    seoDescription: product.seoDescription || product.description || "Newly added product.",
    seoKeywords: product.seoKeywords || [],
    slug: product.slug || `new-product-${Date.now()}`,
    variants: [],
    sku: product.sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
    weight: product.weight,
    dimensions: product.dimensions,
    status: product.status || "published",
    featured: Boolean(product.featured),
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString(),
  } as Product;

  const nextProducts = [fallbackProduct, ...products.filter((item) => item.id !== fallbackProduct.id)];
  products = nextProducts;
  persistProducts(products);

  try {
    const response = await fetch(PRODUCTS_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-dev-admin": "true" },
      body: JSON.stringify(mapToApiPayload(product)),
    });
    if (!response.ok) throw new Error("Backend save failed");
    const payload = await response.json();
    const savedProduct = mapApiProduct(payload);
    const merged = [savedProduct, ...products.filter((item) => item.id !== savedProduct.id)];
    products = merged;
    persistProducts(products);
    return savedProduct;
  } catch {
    return fallbackProduct;
  }
}

export async function updateProduct(id: string, productData: Partial<Product> & { category?: string; slug?: string; seoTitle?: string; seoDescription?: string; seoKeywords?: string[]; sku?: string; weight?: number; dimensions?: { width?: number; height?: number; depth?: number }; status?: string; featured?: boolean; createdAt?: string; updatedAt?: string }) {
  const index = products.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const updated = {
    ...products[index],
    ...productData,
    id,
    updatedAt: new Date().toISOString(),
  } as Product;

  products = products.map((item) => (item.id === id ? updated : item));
  persistProducts(products);

  try {
    const response = await fetch(`${PRODUCTS_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-dev-admin": "true" },
      body: JSON.stringify(mapToApiPayload(productData)),
    });
    if (response.ok) {
      const payload = await response.json();
      const savedProduct = mapApiProduct(payload);
      products = products.map((item) => (item.id === id ? savedProduct : item));
      persistProducts(products);
      return savedProduct;
    }
  } catch {
    // fall back to local update
  }

  return updated;
}

export async function deleteProduct(id: string) {
  products = products.filter((item) => item.id !== id);
  persistProducts(products);

  try {
    await fetch(`${PRODUCTS_BASE}/${id}`, {
      method: "DELETE",
      headers: { "x-dev-admin": "true" },
    });
  } catch {
    // fall back to local delete
  }
}

export async function bulkUpdateProducts(ids: string[], action: string, data?: Record<string, unknown>) {
  const now = new Date().toISOString();

  switch (action) {
    case "publish":
      products = products.map((p) => (ids.includes(p.id) ? { ...p, status: "published" as const, updatedAt: now } : p));
      break;
    case "archive":
      products = products.map((p) => (ids.includes(p.id) ? { ...p, status: "archived" as const, updatedAt: now } : p));
      break;
    case "delete":
      products = products.filter((p) => !ids.includes(p.id));
      break;
  }

  persistProducts(products);

  try {
    await fetch(`${PRODUCTS_BASE}/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-dev-admin": "true" },
      body: JSON.stringify({ action, ids, data }),
    });
  } catch {
    // fall back to local update
  }
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}
