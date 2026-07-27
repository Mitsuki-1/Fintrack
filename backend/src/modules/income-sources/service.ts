import { getDatabase } from '../../db/client';
import { AppError } from '../../middleware/error';
import type { IncomeSource, IncomeSourceType } from '../../types';

function rowToSource(row: Record<string, any>): IncomeSource {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    name: row.name as string,
    type: row.type as IncomeSourceType,
    isActive: row.is_active === 1 || row.is_active === 1n,
    createdAt: row.created_at as string,
  };
}

export async function list(userId: number): Promise<IncomeSource[]> {
  const db = await getDatabase();
  const result = await db.execute({
    sql: 'SELECT * FROM income_sources WHERE user_id = ? ORDER BY created_at DESC',
    args: [userId],
  });
  return result.rows.map(rowToSource);
}

export async function create(
  userId: number,
  name: string,
  type: IncomeSourceType
): Promise<IncomeSource> {
  const db = await getDatabase();

  const insertResult = await db.execute({
    sql: 'INSERT INTO income_sources (user_id, name, type) VALUES (?, ?, ?)',
    args: [userId, name, type],
  });

  const id = Number(insertResult.lastInsertRowid);

  const sourceResult = await db.execute({
    sql: 'SELECT * FROM income_sources WHERE id = ?',
    args: [id],
  });
  return rowToSource(sourceResult.rows[0]);
}

export async function update(
  userId: number,
  id: number,
  data: { name?: string; type?: IncomeSourceType; isActive?: boolean }
): Promise<IncomeSource> {
  const db = await getDatabase();

  const existing = await db.execute({
    sql: 'SELECT * FROM income_sources WHERE id = ?',
    args: [id],
  });
  if (existing.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Источник дохода не найден');
  }

  const row = existing.rows[0];
  if (Number(row.user_id) !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Источник дохода не найден');
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.type !== undefined) {
    updates.push('type = ?');
    params.push(data.type);
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(data.isActive ? 1 : 0);
  }

  if (updates.length > 0) {
    params.push(id);
    await db.execute({
      sql: `UPDATE income_sources SET ${updates.join(', ')} WHERE id = ?`,
      args: params,
    });
  }

  const updated = await db.execute({
    sql: 'SELECT * FROM income_sources WHERE id = ?',
    args: [id],
  });
  return rowToSource(updated.rows[0]);
}

export async function remove(userId: number, id: number): Promise<void> {
  const db = await getDatabase();

  const existing = await db.execute({
    sql: 'SELECT * FROM income_sources WHERE id = ?',
    args: [id],
  });
  if (existing.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Источник дохода не найден');
  }

  if (Number(existing.rows[0].user_id) !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Источник дохода не найден');
  }

  await db.execute({
    sql: 'DELETE FROM income_sources WHERE id = ?',
    args: [id],
  });
}
