import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../services/prisma.js';
import { authMiddleware, AuthenticatedRequest, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler, AppError } from '../middleware/error.js';
import { generateOrderNumber } from '../utils/helpers.js';
import { sendEmail, buildOrderConfirmationEmail } from '../services/email.js';

const router = Router();

const orderQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
    userId: z.string().cuid().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

const orderStatusUpdateSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
    trackingNumber: z.string().optional(),
    notes: z.string().optional(),
  }),
});

const createOrderSchema = z.object({
  body: z.object({
    userId: z.string().optional(),
    userName: z.string().optional(),
    userEmail: z.string().email().optional(),
    shippingAddress: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      address: z.string().min(1),
      apartment: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
      country: z.string().min(1),
    }),
    paymentInfo: z.object({
      cardNumber: z.string().optional(),
      expiry: z.string().optional(),
      cvc: z.string().optional(),
      nameOnCard: z.string().optional(),
    }).optional(),
    items: z.array(z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
      color: z.string().optional(),
    })),
    subtotal: z.number().nonnegative(),
    shipping: z.number().nonnegative(),
    discount: z.number().nonnegative(),
    tax: z.number().nonnegative(),
    total: z.number().nonnegative(),
  }),
});

// POST /orders - Create order (customer)
router.post('/', authMiddleware, validate(createOrderSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { userId, userName, userEmail, shippingAddress, paymentInfo, items, subtotal, shipping, discount, tax, total } = req.body;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: userId || req.user?.id || 'dev-user',
      status: 'PENDING',
      subtotal: subtotal.toFixed(2),
      shipping: shipping.toFixed(2),
      discount: discount.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      shippingAddress: shippingAddress,
      paymentInfo: paymentInfo || {},
      items: {
        create: items.map((item: { productId: string; quantity: number; price: number; color?: string }) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price.toFixed(2),
          color: item.color || '',
        })),
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { product: { select: { id: true, title: true } } } },
    },
  });

  if (req.user?.id && req.user.id !== 'dev-admin') {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { updatedAt: new Date() },
    });
  }

  const orderItems = items.map((item: { productId: string; quantity: number; price: number }) => ({
    title: order.items.find((oi: { product: { id: string; title: string } }) => oi.product.id === item.productId)?.product?.title || 'Product',
    qty: item.quantity,
    price: item.price,
  }));

  const customerEmail = userEmail || req.user?.email || '';
  if (customerEmail) {
    sendEmail(
      customerEmail,
      `Order Confirmed #${order.orderNumber} — Top Shelf Exotics`,
      buildOrderConfirmationEmail(order.orderNumber, userName || 'there', orderItems, total)
    ).catch(() => {});
  }

  res.status(201).json(order);
}));

// GET /orders/my - List my orders (customer)
router.get('/my', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, title: true, images: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data: orders });
}));

// GET /orders/my/:id - Get single order for current user (customer)
router.get('/my/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, title: true, images: true, slug: true },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  res.json(order);
}));

// GET /orders - List orders (admin)
router.get('/', authMiddleware, requireAdmin, validate(orderQuerySchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = '1', limit = '20', search, status, userId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (status) where.status = status;
  if (userId) where.userId = userId;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, title: true, images: true },
            },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder } as unknown as Prisma.OrderOrderByWithRelationInput,
      skip,
      take: limitNum,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    data: orders,
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

// GET /orders/stats - Get order stats (admin)
router.get('/stats', authMiddleware, requireAdmin, asyncHandler(async (_req: AuthenticatedRequest, res) => {
  const [totalOrders, ordersByStatus, revenueStats, recentOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.groupBy({
      by: ['status'],
      _count: true,
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      _avg: { total: true },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const monthlyRevenue = await prisma.order.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1) },
      status: { in: ['DELIVERED', 'SHIPPED'] },
    },
    _sum: { total: true },
  });

  res.json({
    totalOrders,
    ordersByStatus: ordersByStatus.map(s => ({
      status: s.status,
      count: s._count,
      total: s._sum.total ? Number(s._sum.total) : 0,
    })),
    totalRevenue: Number(revenueStats._sum.total || 0),
    averageOrderValue: Number(revenueStats._avg.total || 0),
    recentOrders,
    monthlyRevenue: monthlyRevenue.map(m => ({
      month: m.createdAt.toISOString().substring(0, 7),
      revenue: Number(m._sum.total || 0),
    })),
  });
}));

// GET /orders/:id - Get single order (admin)
router.get('/:id', authMiddleware, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              images: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  res.json(order);
}));

// PUT /orders/:id/status - Update order status (admin)
router.put('/:id/status', authMiddleware, requireAdmin, validate(orderStatusUpdateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, trackingNumber, notes } = req.body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(trackingNumber && {
        shippingAddress: JSON.stringify({
          ...JSON.parse(order.shippingAddress || '{}'),
          trackingNumber,
        }),
      }),
      ...(notes && {
        paymentInfo: JSON.stringify({
          ...JSON.parse(order.paymentInfo || '{}'),
          adminNotes: notes,
        }),
      }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { product: { select: { id: true, title: true } } } },
    },
  });

  res.json(updated);
}));

// DELETE /orders/:id - Delete order (admin)
router.delete('/:id', authMiddleware, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  await prisma.order.delete({ where: { id } });

  res.json({ success: true });
}));

export default router;