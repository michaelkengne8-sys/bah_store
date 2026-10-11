import type { User, SessionInfo } from "../types";
import { AUTH_BASE } from "./config";

const TOKEN_KEY = "tse-auth-token";
const REFRESH_TOKEN_KEY = "tse-refresh-token";
const USER_KEY = "tse-user-session";

let currentSession: { user: User; token: string } | null = null;

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: raw.id as string,
    name: raw.name as string,
    email: raw.email as string,
    phone: raw.phone as string | undefined,
    avatar: raw.avatar as string | undefined,
    role: (raw.role as string)?.toLowerCase() as "user" | "admin",
    createdAt: raw.createdAt as string,
    loyaltyTier: (raw.loyaltyTier as string)?.toLowerCase() as "bronze" | "silver" | "gold" | "platinum",
    loyaltyPoints: raw.loyaltyPoints as number,
    emailVerified: raw.emailVerified as boolean,
    twoFactorEnabled: raw.twoFactorEnabled as boolean,
  };
}

async function getErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.error || data.message || `Request failed with status ${res.status}`;
  } catch {
    return `Request failed with status ${res.status}`;
  }
}

function getTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getRefreshTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

async function tryRefresh(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${AUTH_BASE}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getTokenFromStorage();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${AUTH_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && endpoint !== "/refresh") {
    const refreshToken = getRefreshTokenFromStorage();
    if (refreshToken) {
      const newToken = await tryRefresh(refreshToken);
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        const retryRes = await fetch(`${AUTH_BASE}${endpoint}`, {
          ...options,
          headers,
        });
        if (retryRes.ok) {
          return retryRes.json();
        }
        if (retryRes.status === 401) {
          clearSession();
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(await getErrorMessage(retryRes));
      }
    }
    clearSession();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }

  return res.json();
}

function clearSession() {
  currentSession = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export const authApi = {
  async login(email: string, password: string, rememberMe = false) {
    const data = await request<{
      user: Record<string, unknown>;
      accessToken: string;
      refreshToken: string;
    }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password, rememberMe }),
    });

    const user = normalizeUser(data.user);
    const session = { user, token: data.accessToken };
    currentSession = session;
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return session;
  },

  async googleSignIn(idToken: string) {
    const data = await request<{
      user: Record<string, unknown>;
      accessToken: string;
      refreshToken: string;
    }>("/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });

    const user = normalizeUser(data.user);
    const session = { user, token: data.accessToken };
    currentSession = session;
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return session;
  },

  async appleSignIn(idToken: string) {
    const data = await request<{
      user: Record<string, unknown>;
      accessToken: string;
      refreshToken: string;
    }>("/apple", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });

    const user = normalizeUser(data.user);
    const session = { user, token: data.accessToken };
    currentSession = session;
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return session;
  },

  async register(name: string, email: string, password: string) {
    const data = await request<{
      user: Record<string, unknown>;
      verified: boolean;
      message: string;
    }>("/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    return { user: normalizeUser(data.user), verified: data.verified, message: data.message };
  },

  async verifyOtp(email: string, otp: string) {
    const data = await request<{
      user: Record<string, unknown>;
      accessToken: string;
      refreshToken: string;
    }>("/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });

    const user = normalizeUser(data.user);
    const session = { user, token: data.accessToken };
    currentSession = session;
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return session;
  },

  async verifyEmailLink(token: string) {
    const data = await request<{
      user: Record<string, unknown>;
      accessToken: string;
      refreshToken: string;
    }>("/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });

    const user = normalizeUser(data.user);
    const session = { user, token: data.accessToken };
    currentSession = session;
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return session;
  },

  async resendOtp(email: string) {
    await request<{ success: boolean; message: string }>("/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async getProfile() {
    const data = await request<Record<string, unknown>>("/me");
    return normalizeUser(data);
  },

  async updateProfile(data: Partial<User>) {
    const body: Record<string, unknown> = {};
    if (data.name) body.name = data.name;
    if (data.phone !== undefined) body.phone = data.phone;
    if (data.avatar !== undefined) body.avatar = data.avatar;

    const result = await request<Record<string, unknown>>("/me", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    const user = normalizeUser(result);
    if (currentSession) {
      currentSession = { ...currentSession, user };
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    }
    return user;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    await request("/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async forgotPassword(email: string) {
    await request("/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string) {
    await request("/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  },

  async verifyEmail(token: string) {
    await request("/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  async resendVerificationEmail(email: string) {
    await request("/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async getSessions(): Promise<SessionInfo[]> {
    return request<SessionInfo[]>("/sessions");
  },

  async revokeSession(sessionId: string) {
    await request(`/sessions/${sessionId}`, {
      method: "DELETE",
    });
  },

  async revokeAllOtherSessions() {
    await request("/sessions", {
      method: "DELETE",
    });
  },

  logout() {
    const token = getTokenFromStorage();
    if (token) {
      fetch(`${AUTH_BASE}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }
    clearSession();
  },

  getToken(): string | null {
    if (typeof window === "undefined") return currentSession?.token || null;
    return localStorage.getItem(TOKEN_KEY) || currentSession?.token || null;
  },

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return currentSession?.user || null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return currentSession?.user || null;
  },

  getSession() {
    return currentSession;
  },

  setSession(session: { user: User; token: string }) {
    currentSession = session;
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, session.token);
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    }
  },

  clearSession() {
    clearSession();
  },

  isTokenValid(token: string): boolean {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1]));
      return Date.now() < payload.exp * 1000;
    } catch {
      return false;
    }
  },
};
