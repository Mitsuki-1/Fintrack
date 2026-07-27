import { getDatabase } from '../../db/client';
import { AppError } from '../../middleware/error';
import type { Category, CategoryKind } from '../../types';

function rowToCategory(row: Record<string, any>): Category {
  return {
    id: Number(row.id),
    userId: row.user_id != null ? Number(row.user_id) : null,
    name: row.name as string,
    kind: row.kind as CategoryKind,
    icon: row.icon as string | null,
    color: row.color as string | null,
  };
}

export async function list(userId: number): Promise<Category[]> {
  const db = await getDatabase();
  const result = await db.execute({
    sql: `SELECT * FROM categories WHERE user_id IS NULL OR user_id = ? ORDER BY user_id IS NULL DESC, id ASC`,
    args: [userId],
  });
  return result.rows.map(rowToCategory);
}

export async function create(
  userId: number,
  data: { name: string; kind: CategoryKind; color?: string }
): Promise<Category> {
  const db = await getDatabase();

  const insertResult = await db.execute({
    sql: 'INSERT INTO categories (user_id, name, kind, color) VALUES (?, ?, ?, ?)',
    args: [userId, data.name, data.kind, data.color || null],
  });

  const id = Number(insertResult.lastInsertRowid);

  const catResult = await db.execute({
    sql: 'SELECT * FROM categories WHERE id = ?',
    args: [id],
  });
  return rowToCategory(catResult.rows[0]);
}

export async function update(
  userId: number,
  id: number,
  data: { name?: string; kind?: CategoryKind; color?: string | null }
): Promise<Category> {
  const db = await getDatabase();

  const existing = await db.execute({
    sql: 'SELECT * FROM categories WHERE id = ?',
    args: [id],
  });
  if (existing.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Категория не найдена');
  }

  const row = existing.rows[0];

  if (row.user_id == null) {
    throw new AppError(403, 'FORBIDDEN', 'Нельзя редактировать системные категории');
  }

  if (Number(row.user_id) !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Категория не найдена');
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name); }
  if (data.kind !== undefined) { updates.push('kind = ?'); params.push(data.kind); }
  if (data.color !== undefined) { updates.push('color = ?'); params.push(data.color); }

  if (updates.length > 0) {
    params.push(id);
    await db.execute({
      sql: `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
      args: params,
    });
  }

  const updated = await db.execute({
    sql: 'SELECT * FROM categories WHERE id = ?',
    args: [id],
  });
  return rowToCategory(updated.rows[0]);
}

export async function remove(userId: number, id: number): Promise<void> {
  const db = await getDatabase();

  const existing = await db.execute({
    sql: 'SELECT * FROM categories WHERE id = ?',
    args: [id],
  });
  if (existing.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Категория не найдена');
  }

  const row = existing.rows[0];

  if (row.user_id == null) {
    throw new AppError(403, 'FORBIDDEN', 'Нельзя удалить системные категории');
  }

  if (Number(row.user_id) !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Категория не найдена');
  }

  const expenseResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM expenses WHERE category_id = ? AND user_id = ?',
    args: [id, userId],
  });
  const count = Number(expenseResult.rows[0]?.['count'] ?? 0);

  if (count > 0) {
    throw new AppError(
      409,
      'CONFLICT',
      'Нельзя удалить категорию, к которой привязаны расходы. Перенесите расходы в другую категорию.'
    );
  }

  await db.execute({
    sql: 'DELETE FROM categories WHERE id = ?',
    args: [id],
  });
}
