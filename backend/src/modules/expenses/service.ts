import { getDatabase } from '../../db/client';
import { AppError } from '../../middleware/error';
import type { Expense, Recurrence, PaginatedResponse } from '../../types';

function rowToExpense(row: Record<string, any>): Expense {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    categoryId: Number(row.category_id),
    amountMinor: Number(row.amount_minor),
    currency: row.currency as string,
    spentAt: row.spent_at as string,
    description: row.description as string | null,
    isRecurring: row.is_recurring === 1 || row.is_recurring === 1n,
    recurrence: row.recurrence as Recurrence | null,
    createdAt: row.created_at as string,
  };
}

export async function list(
  userId: number,
  params: {
    from?: string;
    to?: string;
    categoryId?: number;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedResponse<Expense>> {
  const db = await getDatabase();

  const conditions: string[] = ['e.user_id = ?'];
  const queryParams: any[] = [userId];

  if (params.from) {
    conditions.push('e.spent_at >= ?');
    queryParams.push(params.from);
  }
  if (params.to) {
    conditions.push('e.spent_at < ?');
    queryParams.push(params.to);
  }
  if (params.categoryId) {
    conditions.push('e.category_id = ?');
    queryParams.push(params.categoryId);
  }

  const where = conditions.join(' AND ');

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as total FROM expenses e WHERE ${where}`,
    args: queryParams,
  });
  const total = Number(countResult.rows[0]?.['total'] ?? 0);

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const offset = (page - 1) * limit;
  const rowsResult = await db.execute({
    sql: `SELECT e.* FROM expenses e WHERE ${where} ORDER BY e.spent_at DESC, e.created_at DESC LIMIT ? OFFSET ?`,
    args: [...queryParams, limit, offset],
  });

  const items = rowsResult.rows.map(rowToExpense);

  return {
    items,
    page,
    limit,
    total,
  };
}

export async function getById(userId: number, id: number): Promise<Expense> {
  const db = await getDatabase();

  const result = await db.execute({
    sql: 'SELECT * FROM expenses WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Расход не найден');
  }

  const row = result.rows[0];
  if (Number(row.user_id) !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Расход не найден');
  }

  return rowToExpense(row);
}

export async function create(
  userId: number,
  data: {
    categoryId: number;
    amountMinor: number;
    currency: string;
    spentAt: string;
    description?: string | null;
    isRecurring: boolean;
    recurrence: Recurrence | null;
  }
): Promise<Expense> {
  const db = await getDatabase();

  const catResult = await db.execute({
    sql: 'SELECT * FROM categories WHERE id = ? AND (user_id IS NULL OR user_id = ?)',
    args: [data.categoryId, userId],
  });
  if (catResult.rows.length === 0) {
    throw new AppError(400, 'BAD_REQUEST', 'Указанная категория не существует');
  }

  const insertResult = await db.execute({
    sql: `INSERT INTO expenses (user_id, category_id, amount_minor, currency, spent_at, description, is_recurring, recurrence)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      userId,
      data.categoryId,
      data.amountMinor,
      data.currency,
      data.spentAt,
      data.description || null,
      data.isRecurring ? 1 : 0,
      data.recurrence,
    ],
  });

  const id = Number(insertResult.lastInsertRowid);

  const expenseResult = await db.execute({
    sql: 'SELECT * FROM expenses WHERE id = ?',
    args: [id],
  });
  return rowToExpense(expenseResult.rows[0]);
}

export async function update(
  userId: number,
  id: number,
  data: Partial<{
    categoryId: number;
    amountMinor: number;
    currency: string;
    spentAt: string;
    description: string | null;
    isRecurring: boolean;
    recurrence: Recurrence | null;
  }>
): Promise<Expense> {
  const db = await getDatabase();

  const existing = await db.execute({
    sql: 'SELECT * FROM expenses WHERE id = ?',
    args: [id],
  });
  if (existing.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Расход не найден');
  }

  if (Number(existing.rows[0].user_id) !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Расход не найден');
  }

  if (data.categoryId !== undefined) {
    const catResult = await db.execute({
      sql: 'SELECT * FROM categories WHERE id = ? AND (user_id IS NULL OR user_id = ?)',
      args: [data.categoryId, userId],
    });
    if (catResult.rows.length === 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Указанная категория не существует');
    }
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (data.categoryId !== undefined) { updates.push('category_id = ?'); params.push(data.categoryId); }
  if (data.amountMinor !== undefined) { updates.push('amount_minor = ?'); params.push(data.amountMinor); }
  if (data.currency !== undefined) { updates.push('currency = ?'); params.push(data.currency); }
  if (data.spentAt !== undefined) { updates.push('spent_at = ?'); params.push(data.spentAt); }
  if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }
  if (data.isRecurring !== undefined) { updates.push('is_recurring = ?'); params.push(data.isRecurring ? 1 : 0); }
  if (data.recurrence !== undefined) { updates.push('recurrence = ?'); params.push(data.recurrence); }

  if (updates.length > 0) {
    params.push(id);
    await db.execute({
      sql: `UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`,
      args: params,
    });
  }

  const updated = await db.execute({
    sql: 'SELECT * FROM expenses WHERE id = ?',
    args: [id],
  });
  return rowToExpense(updated.rows[0]);
}

export async function remove(userId: number, id: number): Promise<void> {
  const db = await getDatabase();

  const existing = await db.execute({
    sql: 'SELECT * FROM expenses WHERE id = ?',
    args: [id],
  });
  if (existing.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Расход не найден');
  }

  if (Number(existing.rows[0].user_id) !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Расход не найден');
  }

  await db.execute({
    sql: 'DELETE FROM expenses WHERE id = ?',
    args: [id],
  });
}
