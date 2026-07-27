import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err) {
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
      next(err);
    }
  };
}