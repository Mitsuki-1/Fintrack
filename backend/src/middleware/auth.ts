import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export function auth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация' },
    });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Токен недействителен или истёк' },
    });
  }
}