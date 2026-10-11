const DEFAULT_API_BASE = import.meta.env.PROD ? "/api/v1" : "http://localhost:3001/api/v1";

export const API_BASE = import.meta.env.VITE_API_URL || DEFAULT_API_BASE;
export const AUTH_BASE = `${API_BASE}/auth`;
export const ORDERS_BASE = `${API_BASE}/orders`;
export const PRODUCTS_BASE = `${API_BASE}/products`;
export const CASHOUTS_BASE = `${API_BASE}/cashouts`;
export const CONTACT_BASE = `${API_BASE}/contact`;
