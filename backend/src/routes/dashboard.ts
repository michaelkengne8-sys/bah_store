import { Router } from 'express';
import prisma from '../services/prisma.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const [productCount, orderCount, userCount, revenueAgg, lowStockProducts, recentProducts, recentOrders, ordersByMonth] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.product.count({ where: { stock: { contains: 'LOW' } } }),
    prisma.product.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { name: true, email: true } } } }),
    prisma.order.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1) }, status: { in: ['DELIVERED', 'SHIPPED'] } },
      _sum: { total: true },
    }),
  ]);

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
  });

  res.json({
    totalProducts: productCount,
    totalOrders: orderCount,
    totalUsers: userCount,
    totalRevenue: Number(revenueAgg._sum.total || 0),
    lowStockProducts,
    recentProducts,
    recentOrders,
    categories: categories.map(c => ({
      id: c.id,
      name: c.name,
      count: c._count.products,
      revenue: 0,
    })),
    monthlyRevenue: ordersByMonth.map(m => ({
      month: m.createdAt.toISOString().substring(0, 7),
      revenue: Number(m._sum.total || 0),
    })),
  });
}));

export default router;
