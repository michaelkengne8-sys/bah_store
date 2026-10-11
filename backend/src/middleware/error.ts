import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const details = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
    });
    return;
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = error.meta?.target as string[] | undefined;
      res.status(409).json({
        error: 'A record with this value already exists',
        code: 'DUPLICATE_ENTRY',
        field: target?.[0],
      });
      return;
    }
    if (error.code === 'P2025') {
      res.status(404).json({
        error: 'Record not found',
        code: 'NOT_FOUND',
      });
      return;
    }
  }

  // App errors
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details,
    });
    return;
  }

  // Multer errors
  if (error.name === 'MulterError') {
    const multerCode = (error as NodeJS.ErrnoException).code;
    if (multerCode === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File too large', code: 'FILE_TOO_LARGE' });
      return;
    }
    if (multerCode === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ error: 'Too many files', code: 'TOO_MANY_FILES' });
      return;
    }
    res.status(400).json({ error: error.message, code: 'UPLOAD_ERROR' });
    return;
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { message: error.message, stack: error.stack }),
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found', code: 'ROUTE_NOT_FOUND' });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}