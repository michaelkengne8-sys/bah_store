import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../services/prisma.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { validate } from '../middleware/validation.js';
import { generateTokenPair, verifyRefreshToken, extractTokenFromHeader } from '../config/jwt.js';
import { env } from '../config/env.js';
import { sendEmail, buildOtpEmail, buildVerificationLinkEmail, buildOAuthWelcomeEmail } from '../services/email.js';

const router = Router();

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(128),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    rememberMe: z.boolean().optional(),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6),
  }),
});

const verifyEmailLinkSchema = z.object({
  body: z.object({
    token: z.string().min(1),
  }),
});

const resendOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

function issueTokens(userId: string, email: string, role: string) {
  const tokens = generateTokenPair({
    sub: userId,
    email,
    role,
    sid: generateSessionToken(),
  });
  return tokens;
}

async function createSession(userId: string, accessToken: string) {
  await prisma.session.create({
    data: {
      userId,
      token: accessToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

// Register — creates user unverified, sends OTP + verification link
router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 6);
  const verificationToken = generateEmailVerificationToken();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      emailVerified: false,
      otpHash,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  const verificationLink = `${env.appUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

  await Promise.all([
    sendEmail(email, 'Your OTP Code — Top Shelf Exotics', buildOtpEmail(otp, name, email)),
    sendEmail(email, 'Verify your email — Top Shelf Exotics', buildVerificationLinkEmail(verificationLink, name)),
  ]);

  res.status(201).json({
    user,
    verified: false,
    message: 'Account created. Check your email for the OTP code and verification link.',
  });
}));

// Verify email via OTP
router.post('/verify-otp', validate(verifyOtpSchema), asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.emailVerified) {
    return res.status(400).json({ error: 'Email already verified' });
  }

  if (user.otpAttempts >= 5) {
    return res.status(429).json({ error: 'Too many attempts. Request a new OTP.' });
  }

  if (!user.otpHash || !user.otpExpiresAt) {
    return res.status(400).json({ error: 'No OTP requested. Please register again.' });
  }

  if (new Date() > user.otpExpiresAt) {
    return res.status(400).json({ error: 'OTP has expired. Request a new one.' });
  }

  const isValid = await bcrypt.compare(otp, user.otpHash);
  if (!isValid) {
    await prisma.user.update({
      where: { id: user.id },
      data: { otpAttempts: { increment: 1 } },
    });
    return res.status(400).json({ error: 'Invalid OTP code' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
    },
  });

  const tokens = issueTokens(user.id, user.email, user.role);
  await createSession(user.id, tokens.accessToken);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: true,
      createdAt: user.createdAt,
    },
    ...tokens,
  });
}));

// Verify email via link token
router.post('/verify-email', validate(verifyEmailLinkSchema), asyncHandler(async (req, res) => {
  const { token } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationTokenExpiresAt: { gte: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired verification link' });
  }

  if (user.emailVerified) {
    return res.status(400).json({ error: 'Email already verified' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
    },
  });

  const tokens = issueTokens(user.id, user.email, user.role);
  await createSession(user.id, tokens.accessToken);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: true,
      createdAt: user.createdAt,
    },
    ...tokens,
  });
}));

// Resend OTP
router.post('/resend-otp', validate(resendOtpSchema), asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.emailVerified) {
    return res.status(400).json({ error: 'Email already verified' });
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 6);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpHash,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      otpAttempts: 0,
    },
  });

  await sendEmail(email, 'Your New OTP Code — Top Shelf Exotics', buildOtpEmail(otp, user.name, email));

  res.json({ success: true, message: 'New OTP sent to your email' });
}));

// Login
router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!user.emailVerified) {
    return res.status(403).json({
      error: 'Email not verified',
      verified: false,
      email: user.email,
    });
  }

  const sessionId = generateSessionToken();
  const tokens = generateTokenPair({
    sub: user.id,
    email: user.email,
    role: user.role,
    sid: sessionId,
  });

  await prisma.session.create({
    data: {
      userId: user.id,
      token: tokens.accessToken,
      expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
    },
  });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      loyaltyTier: user.loyaltyTier,
      loyaltyPoints: user.loyaltyPoints,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
    },
    ...tokens,
  });
}));

// Refresh token
router.post('/refresh', validate(refreshSchema), asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const payload = verifyRefreshToken(refreshToken);
  if (!payload || payload.type !== 'refresh') {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const tokens = generateTokenPair({
    sub: user.id,
    email: user.email,
    role: user.role,
    sid: payload.sid,
  });

  await prisma.session.updateMany({
    where: { userId: user.id, token: payload.sid },
    data: { token: tokens.accessToken },
  });

  res.json(tokens);
}));

// Logout
router.post('/logout', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (token) {
    await prisma.session.deleteMany({
      where: { userId: req.user!.id, token },
    });
  }

  res.json({ success: true });
}));

// Get current user
router.get('/me', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      phone: true,
      loyaltyTier: true,
      loyaltyPoints: true,
      emailVerified: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
}));

// Change password
router.post('/change-password', authMiddleware, validate(changePasswordSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  const newHash = await bcrypt.hash(newPassword, env.bcryptRounds);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  await prisma.session.deleteMany({ where: { userId: user.id } });

  res.json({ success: true });
}));

// Forgot password
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.json({ success: true });
  }

  const resetToken = Math.random().toString(36).substring(2, 15);
  console.log(`Password reset token for ${email}: ${resetToken}`);

  res.json({ success: true });
}));

// Reset password
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  console.log(`Reset password with token: ${token}`);
  res.json({ success: true });
}));

// Update profile
const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    avatar: z.string().optional(),
  }),
});

router.put('/me', authMiddleware, validate(updateProfileSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { name, phone, avatar } = req.body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (avatar !== undefined) data.avatar = avatar;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      phone: true,
      loyaltyTier: true,
      loyaltyPoints: true,
      emailVerified: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  });

  res.json(user);
}));

// Get sessions
router.get('/sessions', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const currentJwt = extractTokenFromHeader(req.headers.authorization);

  const sessions = await prisma.session.findMany({
    where: { userId: req.user!.id },
    select: {
      id: true,
      token: true,
      device: true,
      ip: true,
      location: true,
      lastActive: true,
    },
    orderBy: { lastActive: 'desc' },
  });

  res.json(sessions.map(s => ({
    id: s.id,
    device: s.device || 'Unknown',
    ip: s.ip || 'Unknown',
    location: s.location || 'Unknown',
    lastActive: s.lastActive.toISOString(),
    current: s.token === currentJwt,
  })));
}));

// Revoke session
router.delete('/sessions/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const session = await prisma.session.findFirst({
    where: { id, userId: req.user!.id },
  });

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  await prisma.session.delete({ where: { id } });

  res.json({ success: true });
}));

// Revoke all other sessions
router.delete('/sessions', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const currentJwt = extractTokenFromHeader(req.headers.authorization);

  await prisma.session.deleteMany({
    where: {
      userId: req.user!.id,
      token: currentJwt ? { not: currentJwt } : undefined,
    },
  });

  res.json({ success: true });
}));

// ---------- Google Sign-In ----------

let googleClient: OAuth2Client | null = null;
function getGoogleClient(): OAuth2Client | null {
  if (googleClient) return googleClient;
  if (!env.googleClientId) return null;
  googleClient = new OAuth2Client(env.googleClientId, env.googleClientSecret);
  return googleClient;
}

const oauthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1),
  }),
});

router.post('/google', validate(oauthSchema), asyncHandler(async (req, res) => {
  const client = getGoogleClient();
  if (!client) {
    return res.status(500).json({ error: 'Google auth not configured on server' });
  }

  const ticket = await client.verifyIdToken({
    idToken: req.body.idToken,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    return res.status(400).json({ error: 'Invalid Google token' });
  }

  const email = payload.email;
  const name = payload.name || email.split('@')[0];
  const avatar = payload.picture || '';
  const googleId = payload.sub;

  let user = await prisma.user.findUnique({ where: { email } });
  let wasNewUser = false;

  if (!user) {
    wasNewUser = true;
    user = await prisma.user.create({
      data: {
        name,
        email,
        avatar,
        emailVerified: true,
        role: 'USER',
        passwordHash: crypto.randomBytes(32).toString('hex'),
      },
    });
  } else if (!user.emailVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, avatar: avatar || user.avatar },
    });
  }

  if (wasNewUser) {
    sendEmail(email, 'Welcome to Top Shelf Exotics!', buildOAuthWelcomeEmail(name, 'Google')).catch(() => {});
  }

  const tokens = generateTokenPair({
    sub: user.id,
    email: user.email,
    role: user.role,
    sid: generateSessionToken(),
  });
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      device: req.headers['user-agent'] || 'Google OAuth',
      ip: req.ip || '',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      loyaltyTier: user.loyaltyTier?.toLowerCase() || 'bronze',
      loyaltyPoints: user.loyaltyPoints,
      createdAt: user.createdAt,
      phone: user.phone,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    sessionId: session.id,
  });
}));

// ---------- Apple Sign-In ----------

const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';

interface AppleKey {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

let cachedAppleKeys: AppleKey[] | null = null;
let appleKeysFetchedAt = 0;

async function getAppleKeys(): Promise<AppleKey[]> {
  const now = Date.now();
  if (cachedAppleKeys && now - appleKeysFetchedAt < 3600000) {
    return cachedAppleKeys;
  }
  const res = await fetch(APPLE_KEYS_URL);
  const data = await res.json() as { keys: AppleKey[] };
  cachedAppleKeys = data.keys;
  appleKeysFetchedAt = now;
  return cachedAppleKeys;
}

interface AppleTokenPayload {
  email: string;
  sub: string;
}

async function verifyAppleToken(idToken: string): Promise<AppleTokenPayload> {
  const decodedHeader = jwt.decode(idToken, { complete: true }) as { header: { kid: string }; payload: jwt.JwtPayload } | null;
  if (!decodedHeader || !decodedHeader.header.kid) {
    throw new Error('Could not decode Apple token header');
  }

  const keys = await getAppleKeys();
  const key = keys.find(k => k.kid === decodedHeader.header.kid);
  if (!key) {
    throw new Error('Apple key not found for token kid');
  }

  const publicKey = crypto.createPublicKey({
    key: { kty: key.kty, n: key.n, e: key.e },
    format: 'jwk',
  });

  const decoded = jwt.verify(idToken, publicKey, {
    algorithms: ['RS256'],
    issuer: 'https://appleid.apple.com',
    audience: env.appleClientId || undefined,
  }) as jwt.JwtPayload;

  if (!decoded.email) {
    throw new Error('Apple token does not contain email');
  }

  return { email: decoded.email, sub: decoded.sub || '' };
}

router.post('/apple', validate(oauthSchema), asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  let email: string;
  let appleId: string;

  try {
    const result = await verifyAppleToken(idToken);
    email = result.email;
    appleId = result.sub;
  } catch {
    return res.status(400).json({ error: 'Invalid Apple token' });
  }

  const name = email.split('@')[0];

  let user = await prisma.user.findUnique({ where: { email } });
  let wasNewUser = false;

  if (!user) {
    wasNewUser = true;
    user = await prisma.user.create({
      data: {
        name,
        email,
        emailVerified: true,
        role: 'USER',
        passwordHash: crypto.randomBytes(32).toString('hex'),
      },
    });
  } else if (!user.emailVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });
  }

  if (wasNewUser) {
    sendEmail(email, 'Welcome to Top Shelf Exotics!', buildOAuthWelcomeEmail(name, 'Apple')).catch(() => {});
  }

  const tokens = generateTokenPair({
    sub: user.id,
    email: user.email,
    role: user.role,
    sid: generateSessionToken(),
  });
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      device: req.headers['user-agent'] || 'Apple Sign-In',
      ip: req.ip || '',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      loyaltyTier: user.loyaltyTier?.toLowerCase() || 'bronze',
      loyaltyPoints: user.loyaltyPoints,
      createdAt: user.createdAt,
      phone: user.phone,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    sessionId: session.id,
  });
}));

export default router;
