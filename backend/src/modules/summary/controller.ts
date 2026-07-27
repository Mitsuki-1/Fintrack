import { Request, Response, NextFunction } from 'express';
import * as summaryService from './service';

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = req.query.month as string;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Параметр month обязателен и должен быть в формате YYYY-MM',
        },
      });
      return;
    }

    const result = await summaryService.getSummary(req.userId, month);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSummaryByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = req.query.month as string;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Параметр month обязателен и должен быть в формате YYYY-MM',
        },
      });
      return;
    }

    const result = await summaryService.getSummaryByCategory(req.userId, month);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSummaryBySource(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = req.query.month as string;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Параметр month обязателен и должен быть в формате YYYY-MM',
        },
      });
      return;
    }

    const result = await summaryService.getSummaryBySource(req.userId, month);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getRecurring(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await summaryService.getRecurring(req.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
