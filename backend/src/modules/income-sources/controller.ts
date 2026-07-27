import { Request, Response, NextFunction } from 'express';
import * as incomeSourceService from './service';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sources = await incomeSourceService.list(req.userId);
    res.json(sources);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, type } = req.body;
    const source = await incomeSourceService.create(req.userId, name, type);
    res.status(201).json(source);
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
    const source = await incomeSourceService.update(req.userId, id, req.body);
    res.json(source);
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
    await incomeSourceService.remove(req.userId, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
