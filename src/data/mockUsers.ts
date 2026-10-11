import type { User } from "../types";

const USERS_STORAGE_KEY = "tse-users";
const CURRENT_USER_KEY = "tse-current-user";
const RESET_TOKENS_KEY = "tse-reset-tokens";
const VERIFICATION_TOKENS_KEY = "tse-verification-tokens";
const LOGIN_ATTEMPTS_KEY = "tse-login-attempts";
const SESSIONS_KEY = "tse-sessions";

// Demo user password: "password123" (hashed simulation)
const DEMO_PASSWORD_HASH = "$2b$10$K8YvO8YvO8YvO8YvO8YvOe"; // bcrypt-like hash simulation

// Initialize demo user if not exists
function initializeDemoUser(): void {
  if (typeof window === "undefined") return;
  try {
    const existing = localStorage.getItem(USERS_STORAGE_KEY);
    if (!existing) {
      const demoUser: User = {
        id: "user-001",
        name: "Guy Anderson",
        email: "guy@topshelffarms.com",
        phone: "+1 (555) 123-4567",
        avatar: undefined,
        role: "user",
        createdAt: "2024-01-15T10:30:00Z",
        lastLoginAt: new Date().toISOString(),
        loyaltyTier: "gold",
        loyaltyPoints: 2400,
        emailVerified: true,
        twoFactorEnabled: false,
      };
      const users = {
        "guy@topshelffarms.com": {
          ...demoUser,
          passwordHash: DEMO_PASSWORD_HASH,
        },
      };
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  } catch {
    // Ignore localStorage errors
  }
}

// Simple password hash simulation (in real app, use bcrypt on server)
function hashPassword(password: string): string {
  // Simulate bcrypt hash with salt
  const salt = "$2b$10$" + Math.random().toString(36).substring(2, 24);
  const hash = btoa(password + salt).substring(0, 31);
  return salt + hash;
}

function verifyPassword(password: string, hash: string): boolean {
  // In real app: return bcrypt.compare(password, hash)
  // Here we simulate: demo user has known hash
  if (hash === DEMO_PASSWORD_HASH) {
    return password === "password123";
  }
  // For other users, extract salt and verify
  const salt = hash.substring(0, 29);
  const testHash = btoa(password + salt).substring(0, 31);
  return hash === salt + testHash;
}

// Generate a simple JWT-like token (base64 encoded payload)
function generateToken(userId: string, rememberMe: boolean): string {
  const payload = {
    sub: userId,
    iat: Date.now(),
    exp: Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000), // 30 days or 1 day
    type: "access",
  };
  return "eyJhbGciOiJIUzI1NiJ9." + btoa(JSON.stringify(payload)) + ".signature";
}

function parseToken(token: string): { sub: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const parsed = parseToken(token);
  if (!parsed) return false;
  return Date.now() < parsed.exp;
}

// Generate secure random token for password reset / email verification
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Password Reset Tokens
export function createPasswordResetToken(email: string): string | null {
  initializeDemoUser();
  const user = findUserByEmail(email);
  if (!user) return null; // Don't reveal if email exists

  const token = generateSecureToken();
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  const tokens = getResetTokens();
  tokens[token] = { email: email.toLowerCase(), expiresAt, used: false };
  saveResetTokens(tokens);

  return token;
}

export function verifyPasswordResetToken(token: string): { email: string; valid: boolean } {
  const tokens = getResetTokens();
  const record = tokens[token];

  if (!record) return { email: "", valid: false };
  if (record.used) return { email: "", valid: false };
  if (Date.now() > record.expiresAt) return { email: "", valid: false };

  return { email: record.email, valid: true };
}

export function consumePasswordResetToken(token: string, newPassword: string): boolean {
  const tokens = getResetTokens();
  const record = tokens[token];

  if (!record || record.used || Date.now() > record.expiresAt) return false;

  const users = getUsers();
  const user = users[record.email];
  if (!user) return false;

  user.passwordHash = hashPassword(newPassword);
  users[record.email] = user;
  saveUsers(users);

  record.used = true;
  saveResetTokens(tokens);

  return true;
}

function getResetTokens(): Record<string, { email: string; expiresAt: number; used: boolean }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(RESET_TOKENS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveResetTokens(tokens: Record<string, { email: string; expiresAt: number; used: boolean }>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    // Ignore
  }
}

// Email Verification Tokens
export function createEmailVerificationToken(email: string): string {
  const token = generateSecureToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  const tokens = getVerificationTokens();
  tokens[token] = { email: email.toLowerCase(), expiresAt, used: false };
  saveVerificationTokens(tokens);

  return token;
}

export function verifyEmailVerificationToken(token: string): { email: string; valid: boolean } {
  const tokens = getVerificationTokens();
  const record = tokens[token];

  if (!record) return { email: "", valid: false };
  if (record.used) return { email: "", valid: false };
  if (Date.now() > record.expiresAt) return { email: "", valid: false };

  return { email: record.email, valid: true };
}

export function consumeEmailVerificationToken(token: string): boolean {
  const tokens = getVerificationTokens();
  const record = tokens[token];

  if (!record || record.used || Date.now() > record.expiresAt) return false;

  const users = getUsers();
  const user = users[record.email];
  if (!user) return false;

  user.emailVerified = true;
  users[record.email] = user;
  saveUsers(users);

  record.used = true;
  saveVerificationTokens(tokens);

  return true;
}

function getVerificationTokens(): Record<string, { email: string; expiresAt: number; used: boolean }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(VERIFICATION_TOKENS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVerificationTokens(tokens: Record<string, { email: string; expiresAt: number; used: boolean }>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VERIFICATION_TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    // Ignore
  }
}

// Session Management
export function getUserSessions(userId: string): Array<{ id: string; device: string; ip: string; location: string; lastActive: string; current: boolean }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    const sessions = raw ? JSON.parse(raw) : [];
    return sessions.filter((s: { userId: string }) => s.userId === userId);
  } catch {
    return [];
  }
}

export function addSession(userId: string, session: { id: string; device: string; ip: string; location: string }): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    const sessions = raw ? JSON.parse(raw) : [];
    sessions.push({ ...session, userId, lastActive: new Date().toISOString(), current: true });
    // Mark others as not current
    sessions.forEach((s: { id: string; current: boolean; userId: string }) => {
      if (s.userId === userId && s.id !== session.id) s.current = false;
    });
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Ignore
  }
}

export function revokeSession(userId: string, sessionId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    const sessions = raw ? JSON.parse(raw) : [];
    const index = sessions.findIndex((s: { id: string; userId: string }) => s.id === sessionId && s.userId === userId);
    if (index === -1) return false;
    sessions.splice(index, 1);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    return true;
  } catch {
    return false;
  }
}

export function revokeAllOtherSessions(userId: string, currentSessionId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    const sessions = raw ? JSON.parse(raw) : [];
    const filtered = sessions.filter((s: { id: string; userId: string }) => !(s.userId === userId && s.id !== currentSessionId));
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

// Rate Limiting / Login Attempts
export function recordLoginAttempt(email: string, success: boolean): { allowed: boolean; remainingAttempts: number; lockedUntil?: number } {
  if (typeof window === "undefined") return { allowed: true, remainingAttempts: 5 };

  const key = email.toLowerCase();
  const attempts = getLoginAttempts();
  const now = Date.now();

  // Clean old attempts (older than 15 minutes)
  const recentAttempts = (Array.isArray(attempts[key]) ? attempts[key] : []).filter((ts: number) => now - ts < 15 * 60 * 1000);

  if (success) {
    // Clear attempts on successful login
    delete attempts[key];
    saveLoginAttempts(attempts);
    return { allowed: true, remainingAttempts: 5 };
  }

  // Failed attempt
  recentAttempts.push(now);
  attempts[key] = recentAttempts;
  saveLoginAttempts(attempts);

  const failedCount = recentAttempts.length;
  const maxAttempts = 5;

  if (failedCount >= maxAttempts) {
    // Lock for 15 minutes after 5 failed attempts
    const lockedUntil = now + 15 * 60 * 1000;
    attempts[key + "_locked"] = lockedUntil;
    saveLoginAttempts(attempts);
    return { allowed: false, remainingAttempts: 0, lockedUntil };
  }

  return { allowed: true, remainingAttempts: maxAttempts - failedCount };
}

export function checkLoginLockout(email: string): { locked: boolean; lockedUntil?: number } {
  if (typeof window === "undefined") return { locked: false };

  const key = email.toLowerCase() + "_locked";
  const attempts = getLoginAttempts();
  const lockedUntil = attempts[key];

  if (typeof lockedUntil === "number" && Date.now() < lockedUntil) {
    return { locked: true, lockedUntil };
  }

  // Lock expired, clean up
  if (lockedUntil) {
    delete attempts[key];
    saveLoginAttempts(attempts);
  }

  return { locked: false };
}

function getLoginAttempts(): Record<string, number[] | number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLoginAttempts(attempts: Record<string, number[] | number>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch {
    // Ignore
  }
}

export function getUsers(): Record<string, User & { passwordHash: string }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, User & { passwordHash: string }>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // Ignore quota errors
  }
}

export function findUserByEmail(email: string): (User & { passwordHash: string }) | null {
  initializeDemoUser();
  const users = getUsers();
  return users[email.toLowerCase()] || null;
}

export function createUser(name: string, email: string, password: string): User {
  initializeDemoUser();
  const users = getUsers();
  const lowerEmail = email.toLowerCase();

  if (users[lowerEmail]) {
    throw new Error("An account with this email already exists");
  }

  const now = new Date().toISOString();
  const newUser: User = {
    id: "user-" + Date.now().toString(36),
    name,
    email: lowerEmail,
    phone: undefined,
    avatar: undefined,
    role: "user",
    createdAt: now,
    lastLoginAt: now,
    loyaltyTier: "bronze",
    loyaltyPoints: 0,
    emailVerified: false,
    twoFactorEnabled: false,
    twoFactorSecret: undefined,
    backupCodes: undefined,
  };

  const userWithPassword = {
    ...newUser,
    passwordHash: hashPassword(password),
  };

  users[lowerEmail] = userWithPassword;
  saveUsers(users);
  return newUser;
}

export function validateCredentials(email: string, password: string): User | null {
  initializeDemoUser();
  const user = findUserByEmail(email);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export function updateUser(userId: string, updates: Partial<User>): User | null {
  const users = getUsers();
  let targetUser: (User & { passwordHash: string }) | null = null;
  let targetEmail = "";

  for (const [email, user] of Object.entries(users)) {
    if (user.id === userId) {
      targetUser = user;
      targetEmail = email;
      break;
    }
  }

  if (!targetUser) return null;

  const updatedUser = { ...targetUser, ...updates };
  users[targetEmail] = updatedUser;
  saveUsers(users);

  // Update current user in session if it's the same user
  const currentSession = getCurrentSession();
  if (currentSession && currentSession.user.id === userId) {
    setCurrentSession({ ...currentSession, user: updatedUser });
  }

  return updatedUser;
}

export function changePassword(userId: string, currentPassword: string, newPassword: string): boolean {
  const users = getUsers();
  let targetUser: (User & { passwordHash: string }) | null = null;
  let targetEmail = "";

  for (const [email, user] of Object.entries(users)) {
    if (user.id === userId) {
      targetUser = user;
      targetEmail = email;
      break;
    }
  }

  if (!targetUser) return false;
  if (!verifyPassword(currentPassword, targetUser.passwordHash)) return false;

  targetUser.passwordHash = hashPassword(newPassword);
  users[targetEmail] = targetUser;
  saveUsers(users);
  return true;
}

export function getCurrentSession(): { user: User; token: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!isTokenValid(session.token)) {
      clearCurrentSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setCurrentSession(session: { user: User; token: string }): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
  } catch {
    // Ignore
  }
}

export function clearCurrentSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
  } catch {
    // Ignore
  }
}

export function loginUser(email: string, password: string, rememberMe: boolean): { user: User; token: string } {
  // Check rate limiting
  const lockout = checkLoginLockout(email);
  if (lockout.locked) {
    const minutes = Math.ceil((lockout.lockedUntil! - Date.now()) / 60000);
    throw new Error(`Too many failed attempts. Please try again in ${minutes} minutes.`);
  }

  const user = validateCredentials(email, password);
  const attemptResult = recordLoginAttempt(email, !!user);

  if (!user) {
    if (!attemptResult.allowed) {
      const minutes = Math.ceil((attemptResult.lockedUntil! - Date.now()) / 60000);
      throw new Error(`Too many failed attempts. Please try again in ${minutes} minutes.`);
    }
    throw new Error(`Invalid email or password. ${attemptResult.remainingAttempts} attempts remaining.`);
  }

  const token = generateToken(user.id, rememberMe);
  const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };

  // Update last login
  const users = getUsers();
  if (users[email.toLowerCase()]) {
    users[email.toLowerCase()] = { ...users[email.toLowerCase()], lastLoginAt: updatedUser.lastLoginAt };
    saveUsers(users);
  }

  // Add session
  const sessionId = "sess-" + Date.now().toString(36);
  addSession(user.id, {
    id: sessionId,
    device: navigator.userAgent,
    ip: "192.168.1.1", // Simulated
    location: "Current Location", // Simulated
  });

  return { user: updatedUser, token };
}

export function registerUser(name: string, email: string, password: string): { user: User; token: string } {
  const user = createUser(name, email, password);
  const token = generateToken(user.id, false);

  // Create email verification token (in real app, send via email)
  createEmailVerificationToken(email);

  return { user, token };
}