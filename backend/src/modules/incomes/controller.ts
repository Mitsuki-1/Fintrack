import { Request, Response, NextFunction } from 'express';
import * as incomeService from './service';
import { getIncomesQuerySchema } from './schema';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = getIncomesQuerySchema.parse(req.query);
    const result = await incomeService.list(req.userId, query);
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
    const income = await incomeService.getById(req.userId, id);
    res.json(income);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const income = await incomeService.create(req.userId, req.body);
    res.status(201).json(income);
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
    const income = await incomeService.update(req.userId, id, req.body);
    res.json(income);
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
    await incomeService.remove(req.userId, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
