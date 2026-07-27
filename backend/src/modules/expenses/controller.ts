import { Request, Response, NextFunction } from 'express';
import * as expenseService from './service';
import { getExpensesQuerySchema } from './schema';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = getExpensesQuerySchema.parse(req.query);
    const result = await expenseService.list(req.userId, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Некорректный идентификатор' } });
      return;
    }
    const expense = await expenseService.getById(req.userId, id);
    res.json(expense);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const expense = await expenseService.create(req.userId, req.body);
    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Некорректный идентификатор' } });
      return;
    }
    const expense = await expenseService.update(req.userId, id, req.body);
    res.json(expense);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Некорректный идентификатор' } });
      return;
    }
    await expenseService.remove(req.userId, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
