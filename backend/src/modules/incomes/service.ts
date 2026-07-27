import { getDatabase } from '../../db/client';
import { AppError } from '../../middleware/error';
import type { Income, Recurrence, PaginatedResponse } from '../../types';

function rowToIncome(row: Record<string, any>): Income {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    sourceId: row.source_id != null ? Number(row.source_id) : null,
    amountMinor: Number(row.amount_minor),
    currency: row.currency as string,
    receivedAt: row.received_at as string,
    note: row.note as string | null,
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
    sourceId?: number;
    page?: number;
    limit?: number;
  }
): Promise<PaginatedResponse<Income>> {
  const db = await getDatabase();

  const conditions: string[] = ['i.user_id = ?'];
  const queryParams: any[] = [userId];

  if (params.from) {
    conditions.push('i.received_at >= ?');
    queryParams.push(params.from);
  }
  if (params.to) {
    conditions.push('i.received_at < ?');
    queryParams.push(params.to);
  }
  if (params.sourceId) {
    conditions.push('i.source_id = ?');
    queryParams.push(params.sourceId);
  }

  const where = conditions.join(' AND ');

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as total FROM incomes i WHERE ${where}`,
    args: queryParams,
  });
  const total = Number(countResult.rows[0]?.['total'] ?? 0);

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const offset = (page - 1) * limit;
  const rowsResult = await db.execute({
    sql: `SELECT i.* FROM incomes i WHERE ${where} ORDER BY i.received_at DESC, i.created_at DESC LIMIT ? OFFSET ?`,
    args: [...queryParams, limit, offset],
  });

  const items = rowsResult.rows.map(rowToIncome);

  return {
    items,
    page,
    limit,
    total,
  };
}

export async function getById(userId: number, id: number): Promise<Income> {
  const db = await getDatabase();

  const result = await db.execute({
    sql: 'SELECT * FROM incomes WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Доход не найден');
  }

  const row = result.rows[0];
  if (Number(row.user_id) !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Доход не найден');
  }

  return rowToIncome(row);
}

export async function create(
  userId: number,
  data: {
    sourceId?: number | null;
    amountMinor: number;
    currency: string;
    receivedAt: string;
    note?: string | null;
    isRecurring: boolean;
    recurrence: Recurrence | null;
  }
): Promise<Income> {
  const db = await getDatabase();

  if (data.sourceId) {
    const sourceResult = await db.execute({
      sql: 'SELECT * FROM income_sources WHERE id = ? AND user_id = ?',
      args: [data.sourceId, userId],
    });
    if (sourceResult.rows.length === 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Указанный источник дохода не существует');
    }
  }

  const insertResult = await db.execute({
    sql: `INSERT INTO incomes (user_id, source_id, amount_minor, currency, received_at, note, is_recurring, recurrence)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      userId,
      data.sourceId || null,
      data.amountMinor,
      data.currency,
      data.receivedAt,
      data.note || null,
      data.isRecurring ? 1 : 0,
      data.recurrence,
    ],
  });

  const id = Number(insertResult.lastInsertRowid);

  const incomeResult = await db.execute({
    sql: 'SELECT * FROM incomes WHERE id = ?',
    args: [id],
  });
  return rowToIncome(incomeResult.rows[0]);
}

export async function update(
  userId: number,
  id: number,
  data: Partial<{
    sourceId: number | null;
    amountMinor: number;
    currency: string;
    receivedAt: string;
    note: string | null;
    isRecurring: boolean;
    recurrence: Recurrence | null;
  }>
): Promise<Income> {
  const db = await getDatabase();

  const existing = await db.execute({
    sql: 'SELECT * FROM incomes WHERE id = ?',
    args: [id],
  });
  if (existing.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Доход не найден');
  }

  if (Number(existing.rows[0].user_id) !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Доход не найден');
  }

  if (data.sourceId !== undefined && data.sourceId !== null) {
    const sourceResult = await db.execute({
      sql: 'SELECT * FROM income_sources WHERE id = ? AND user_id = ?',
      args: [data.sourceId, userId],
    });
    if (sourceResult.rows.length === 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Указанный источник дохода не существует');
    }
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (data.sourceId !== undefined) { updates.push('source_id = ?'); params.push(data.sourceId); }
  if (data.amountMinor !== undefined) { updates.push('amount_minor = ?'); params.push(data.amountMinor); }
  if (data.currency !== undefined) { updates.push('currency = ?'); params.push(data.currency); }
  if (data.receivedAt !== undefined) { updates.push('received_at = ?'); params.push(data.receivedAt); }
  if (data.note !== undefined) { updates.push('note = ?'); params.push(data.note); }
  if (data.isRecurring !== undefined) { updates.push('is_recurring = ?'); params.push(data.isRecurring ? 1 : 0); }
  if (data.recurrence !== undefined) { updates.push('recurrence = ?'); params.push(data.recurrence); }

  if (updates.length > 0) {
    params.push(id);
    await db.execute({
      sql: `UPDATE incomes SET ${updates.join(', ')} WHERE id = ?`,
      args: params,
    });
  }

  const updated = await db.execute({
    sql: 'SELECT * FROM incomes WHERE id = ?',
    args: [id],
  });
  return rowToIncome(updated.rows[0]);
}

export async function remove(userId: number, id: number): Promise<void> {
  const db = await getDatabase();

  const existing = await db.execute({
    sql: 'SELECT * FROM incomes WHERE id = ?',
    args: [id],
  });
  if (existing.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Доход не найден');
  }

  if (Number(existing.rows[0].user_id) !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Доход не найден');
  }

  await db.execute({
    sql: 'DELETE FROM incomes WHERE id = ?',
    args: [id],
  });
}
