import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export function signToken(userId: number): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

export function verifyToken(token: string): { sub: number } {
  return jwt.verify(token, env.JWT_SECRET) as unknown as { sub: number };
}