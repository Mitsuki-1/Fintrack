import { Request, Response, NextFunction } from 'express';
import * as categoryService from './service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await categoryService.list(req.userId);
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await categoryService.create(req.userId, req.body);
    res.status(201).json(category);
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
    const category = await categoryService.update(req.userId, id, req.body);
    res.json(category);
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
    await categoryService.remove(req.userId, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
