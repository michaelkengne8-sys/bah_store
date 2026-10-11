import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../services/prisma.js';
import { authMiddleware, AuthenticatedRequest, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler, AppError } from '../middleware/error.js';
import { slugify } from '../utils/helpers.js';

function deserializeProduct(p: Record<string, unknown>) {
  if (typeof p.images === 'string') p.images = JSON.parse(p.images as string);
  if (typeof p.hoverImages === 'string') p.hoverImages = JSON.parse(p.hoverImages as string);
  if (typeof p.colors === 'string') p.colors = JSON.parse(p.colors as string);
  return p;
}

function serializeProductData(data: Record<string, unknown>) {
  const result = { ...data };
  if (Array.isArray(result.images)) result.images = JSON.stringify(result.images);
  if (Array.isArray(result.hoverImages)) result.hoverImages = JSON.stringify(result.hoverImages);
  if (Array.isArray(result.colors)) result.colors = JSON.stringify(result.colors);
  return result;
}

const router = Router();

const productCreateSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1),
    price: z.number().positive(),
    originalPrice: z.number().positive().optional(),
    images: z.array(z.string().url()).min(1).max(10),
    hoverImages: z.array(z.string().url()).max(10).optional(),
    categoryId: z.string().min(1),
    stock: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
    colors: z.array(z.string()).optional(),
    brand: z.string().max(100).optional(),
    badge: z.string().max(50).optional(),
    seoTitle: z.string().max(100).optional(),
    seoDescription: z.string().max(200).optional(),
    seoKeywords: z.string().max(200).optional(),
  }),
});

const productUpdateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    originalPrice: z.number().positive().optional(),
    images: z.array(z.string().url()).min(1).max(10).optional(),
    hoverImages: z.array(z.string().url()).max(10).optional(),
    categoryId: z.string().min(1).optional(),
    stock: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
    colors: z.array(z.string()).optional(),
    brand: z.string().max(100).optional(),
    badge: z.string().max(50).optional(),
    seoTitle: z.string().max(100).optional(),
    seoDescription: z.string().max(200).optional(),
    seoKeywords: z.string().max(200).optional(),
  }),
});

const productQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    stock: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
    sortBy: z.enum(['title', 'price', 'createdAt', 'updatedAt', 'rating']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

// GET /products - List products
router.get('/', validate(productQuerySchema), asyncHandler(async (req, res) => {
  const { page = '1', limit = '20', search, categoryId, stock, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (stock) where.stock = stock;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { [sortBy]: sortOrder } as unknown as Prisma.ProductOrderByWithRelationInput,
      skip,
      take: limitNum,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    data: products.map(p => deserializeProduct(p as unknown as Record<string, unknown>)),
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

// GET /products/:id - Get single product
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      reviews: {
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json(deserializeProduct(product as unknown as Record<string, unknown>));
}));

// GET /products/slug/:slug - Get product by slug
router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      reviews: {
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json(deserializeProduct(product as unknown as Record<string, unknown>));
}));

// POST /products - Create product (admin)
router.post('/', authMiddleware, requireAdmin, validate(productCreateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const data = req.body;

  // Check category exists
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Generate unique slug
  const baseSlug = slugify(data.title);
  const existingSlugs = await prisma.product.findMany({
    where: { slug: { startsWith: baseSlug } },
    select: { slug: true },
  });
  const slug = baseSlug + (existingSlugs.length > 0 ? `-${existingSlugs.length + 1}` : '');

  const product = await prisma.product.create({
    data: serializeProductData({
      ...data,
      slug,
      originalPrice: data.originalPrice ?? data.price,
    }) as Prisma.ProductUncheckedCreateInput,
    include: { category: true },
  });

  // Update category count
  await prisma.category.update({
    where: { id: data.categoryId },
    data: { count: { increment: 1 } },
  });

  res.status(201).json(deserializeProduct(product as unknown as Record<string, unknown>));
}));

// PUT /products/:id - Update product (admin)
router.put('/:id', authMiddleware, requireAdmin, validate(productUpdateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const data = req.body;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Product not found', 404);
  }

  let slug = existing.slug;
  if (data.title && data.title !== existing.title) {
    const baseSlug = slugify(data.title);
    const existingSlugs = await prisma.product.findMany({
      where: { slug: { startsWith: baseSlug }, NOT: { id } },
      select: { slug: true },
    });
    slug = baseSlug + (existingSlugs.length > 0 ? `-${existingSlugs.length + 1}` : '');
  }

  // Handle category change
  if (data.categoryId && data.categoryId !== existing.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    await prisma.category.update({
      where: { id: existing.categoryId },
      data: { count: { decrement: 1 } },
    });
    await prisma.category.update({
      where: { id: data.categoryId },
      data: { count: { increment: 1 } },
    });
  }

  const product = await prisma.product.update({
    where: { id },
    data: serializeProductData({ ...data, slug }),
    include: { category: true },
  });

  res.json(deserializeProduct(product as unknown as Record<string, unknown>));
}));

// DELETE /products/:id - Delete product (admin)
router.delete('/:id', authMiddleware, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  await prisma.product.delete({ where: { id } });

  await prisma.category.update({
    where: { id: product.categoryId },
    data: { count: { decrement: 1 } },
  });

  res.json({ success: true });
}));

// POST /products/bulk - Bulk actions (admin)
router.post('/bulk', authMiddleware, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { action, ids, data } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError('No products selected', 400);
  }

  switch (action) {
    case 'delete':
      await prisma.product.deleteMany({ where: { id: { in: ids } } });
      break;
    case 'updateStock':
      if (!data?.stock) throw new AppError('Stock status required', 400);
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { stock: data.stock },
      });
      break;
    case 'updateCategory':
      if (!data?.categoryId) throw new AppError('Category ID required', 400);
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new AppError('Category not found', 404);
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { categoryId: data.categoryId },
      });
      break;
    default:
      throw new AppError('Invalid action', 400);
  }

  res.json({ success: true, affected: ids.length });
}));

export default router;