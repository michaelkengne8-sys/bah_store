import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { ForbiddenError } from './error.js';

export function adminMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }

  next();
}

export function optionalAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  // Just pass through, admin status checked in route handler
  next();
}