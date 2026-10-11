import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../services/prisma.js';
import { authMiddleware, AuthenticatedRequest, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler, AppError } from '../middleware/error.js';

const router = Router();

const userQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
    loyaltyTier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

const userUpdateSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
    loyaltyTier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).optional(),
    loyaltyPoints: z.number().int().min(0).optional(),
    phone: z.string().optional(),
    avatar: z.string().url().optional(),
    emailVerified: z.boolean().optional(),
    twoFactorEnabled: z.boolean().optional(),
  }),
});

const userCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    role: z.enum(['USER', 'ADMIN']).default('USER'),
    phone: z.string().optional(),
  }),
});

// GET /users - List users (admin)
router.get('/', authMiddleware, requireAdmin, validate(userQuerySchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = '1', limit = '20', search, role, loyaltyTier, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) where.role = role;
  if (loyaltyTier) where.loyaltyTier = loyaltyTier;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
        _count: { select: { orders: true } },
      },
      orderBy: { [sortBy]: sortOrder } as unknown as Prisma.UserOrderByWithRelationInput,
      skip,
      take: limitNum,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    data: users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum * limitNum < total,
      hasPrev: pageNum > 1,
    },
  });
}));

// GET /users/:id - Get user details (admin)
router.get('/:id', authMiddleware, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
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
      updatedAt: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
      },
      addresses: true,
      sessions: {
        orderBy: { lastActive: 'desc' },
        take: 5,
        select: {
          id: true,
          device: true,
          ip: true,
          location: true,
          lastActive: true,
          expiresAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json(user);
}));

// POST /users - Create user (admin)
router.post('/', authMiddleware, requireAdmin, validate(userCreateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { name, email, password, role, phone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, phone },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  res.status(201).json(user);
}));

// PUT /users/:id - Update user (admin)
router.put('/:id', authMiddleware, requireAdmin, validate(userUpdateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const data = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check email uniqueness if changing
  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError('Email already in use', 409);
    }
  }

  const updated = await prisma.user.update({
    where: { id },
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
      updatedAt: true,
    },
  });

  res.json(updated);
}));

// DELETE /users/:id - Delete user (admin)
router.delete('/:id', authMiddleware, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  // Prevent deleting self
  if (id === req.user!.id) {
    throw new AppError('Cannot delete your own account', 400);
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await prisma.user.delete({ where: { id } });

  res.json({ success: true });
}));

// POST /users/:id/ban - Ban/unban user (admin)
router.post('/:id/ban', authMiddleware, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { ban } = req.body;

  if (id === req.user!.id) {
    throw new AppError('Cannot ban yourself', 400);
  }

  // We'll use a custom field or just delete sessions for now
  if (ban) {
    await prisma.session.deleteMany({ where: { userId: id } });
  }

  res.json({ success: true, banned: ban });
}));

export default router;