import { Router } from 'express';
import prisma from '../services/prisma.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/error.js';

const router = Router();

router.use(authMiddleware);

router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { amount, currency, paymentMethod, paymentDetails } = req.body;

  if (!amount || amount <= 0) {
    throw new AppError('Invalid amount', 400);
  }
  if (!paymentMethod) {
    throw new AppError('Payment method required', 400);
  }

  const cashout = await prisma.cashoutRequest.create({
    data: {
      userId: req.user!.id,
      amount,
      currency: currency || 'USD',
      paymentMethod,
      paymentDetails: JSON.stringify(paymentDetails || {}),
      status: 'PENDING',
    },
  });

  res.status(201).json(cashout);
}));

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const cashouts = await prisma.cashoutRequest.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json(cashouts.map(c => ({ ...c, paymentDetails: JSON.parse(c.paymentDetails) })));
}));

router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const cashout = await prisma.cashoutRequest.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });

  if (!cashout) {
    throw new AppError('Cashout request not found', 404);
  }

  res.json({ ...cashout, paymentDetails: JSON.parse(cashout.paymentDetails) });
}));

router.post('/:id/cancel', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const cashout = await prisma.cashoutRequest.findFirst({
    where: { id: req.params.id, userId: req.user!.id, status: 'PENDING' },
  });

  if (!cashout) {
    throw new AppError('Pending cashout request not found', 404);
  }

  const updated = await prisma.cashoutRequest.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });

  res.json(updated);
}));

export default router;
