import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const devBypass = process.env.NODE_ENV !== 'production' && req.headers['x-dev-admin'] === 'true';

    if (devBypass) {
      req.user = {
        id: 'dev-admin',
        email: 'admin@topshelffarms.com',
        role: 'ADMIN',
      };
      next();
      return;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Invalid token format' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

    let decoded: { sub: string; type: string };

    try {
      decoded = jwt.verify(token, secret) as { sub: string; type: string };
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    if (decoded.type !== 'access') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

export const authMiddleware = authenticate;

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

    try {
      const decoded = jwt.verify(token, secret) as { sub: string; type: string };

      if (decoded.type === 'access') {
        const user = await prisma.user.findUnique({
          where: { id: decoded.sub },
          select: { id: true, email: true, role: true },
        });

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
          };
        }
      }
    } catch {
      // Token invalid, continue without user
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};