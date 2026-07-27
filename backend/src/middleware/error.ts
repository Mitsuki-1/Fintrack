import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: { field: string; message: string }[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Обработка известных ошибок приложения
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // Обработка ошибок валидации Zod (на случай, если не перехвачено в middleware)
  if (err instanceof ZodError) {
    const details = err.errors.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Некорректные данные запроса',
        details,
      },
    });
    return;
  }

  // Неизвестная ошибка
  console.error('Internal error:', err);

  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction
        ? 'Внутренняя ошибка сервера'
        : err.message || 'Внутренняя ошибка сервера',
    },
  });
}