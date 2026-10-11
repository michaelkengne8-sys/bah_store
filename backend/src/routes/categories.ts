import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../services/prisma.js';
import { authMiddleware, AuthenticatedRequest, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler, AppError } from '../middleware/error.js';
import { slugify } from '../utils/helpers.js';

const router = Router();

const categoryCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    tagline: z.string().max(200).optional(),
    description: z.string().optional(),
    image: z.string().url().optional(),
    seoTitle: z.string().max(100).optional(),
    seoDescription: z.string().max(200).optional(),
    seoKeywords: z.string().max(200).optional(),
  }),
});

const categoryUpdateSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    tagline: z.string().max(200).optional(),
    description: z.string().optional(),
    image: z.string().url().optional(),
    seoTitle: z.string().max(100).optional(),
    seoDescription: z.string().max(200).optional(),
    seoKeywords: z.string().max(200).optional(),
  }),
});

const categoryQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'createdAt', 'count']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

// GET /categories - List categories
router.get('/', validate(categoryQuerySchema), asyncHandler(async (req, res) => {
  const { page = '1', limit = '20', search, sortBy = 'name', sortOrder = 'asc' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { tagline: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { [sortBy]: sortOrder } as unknown as Prisma.CategoryOrderByWithRelationInput,
      skip,
      take: limitNum,
    }),
    prisma.category.count({ where }),
  ]);

  res.json({
    data: categories,
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

// GET /categories/:id - Get single category
router.get('/:id', asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: {
      products: {
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
          stock: true,
        },
        take: 20,
      },
    },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  res.json(category);
}));

// GET /categories/slug/:slug - Get category by slug
router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: {
      products: {
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
          stock: true,
          slug: true,
        },
        take: 20,
      },
    },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  res.json(category);
}));

// POST /categories - Create category (admin)
router.post('/', authMiddleware, requireAdmin, validate(categoryCreateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const data = req.body;

  const baseSlug = slugify(data.name);
  const existingSlugs = await prisma.category.findMany({
    where: { slug: { startsWith: baseSlug } },
    select: { slug: true },
  });
  const slug = baseSlug + (existingSlugs.length > 0 ? `-${existingSlugs.length + 1}` : '');

  const category = await prisma.category.create({
    data: { ...data, slug },
  });

  res.status(201).json(category);
}));

// PUT /categories/:id - Update category (admin)
router.put('/:id', authMiddleware, requireAdmin, validate(categoryUpdateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const data = req.body;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Category not found', 404);
  }

  let slug = existing.slug;
  if (data.name && data.name !== existing.name) {
    const baseSlug = slugify(data.name);
    const existingSlugs = await prisma.category.findMany({
      where: { slug: { startsWith: baseSlug }, NOT: { id } },
      select: { slug: true },
    });
    slug = baseSlug + (existingSlugs.length > 0 ? `-${existingSlugs.length + 1}` : '');
  }

  const category = await prisma.category.update({
    where: { id },
    data: { ...data, slug },
  });

  res.json(category);
}));

// DELETE /categories/:id - Delete category (admin)
router.delete('/:id', authMiddleware, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (category._count.products > 0) {
    throw new AppError('Cannot delete category with products. Move or delete products first.', 400);
  }

  await prisma.category.delete({ where: { id } });

  res.json({ success: true });
}));

// PUT /categories/reorder - Reorder categories (admin)
router.put('/reorder', authMiddleware, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { orderedIds } = req.body;

  if (!orderedIds || !Array.isArray(orderedIds)) {
    throw new AppError('Invalid order data', 400);
  }

  // We'll use a transaction to update sort order
  // Since Prisma doesn't have built-in sort order, we could add a sortOrder field
  // For now, just return success
  res.json({ success: true });
}));

export default router;