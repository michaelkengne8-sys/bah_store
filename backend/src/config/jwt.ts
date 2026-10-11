import jwt from 'jsonwebtoken';
import { env } from './env.js';

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  type?: 'access' | 'refresh';
  sid?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.jwtSecret, {
    expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as JWTPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as JWTPayload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}