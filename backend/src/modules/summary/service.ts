import { getDatabase } from '../../db/client';
import { getMonthRange } from '../../utils/dates';
import type {
  SummaryResponse,
  SummaryByCategoryItem,
  SummaryBySourceItem,
  RecurringItem,
  RecurringResponse,
} from '../../types';

export async function getSummary(
  userId: number,
  month: string
): Promise<SummaryResponse> {
  const db = await getDatabase();
  const { from, to } = getMonthRange(month);

  const incomeResult = await db.execute({
    sql: `SELECT COALESCE(SUM(amount_minor), 0) AS total
          FROM incomes
          WHERE user_id = ? AND received_at >= ? AND received_at < ?`,
    args: [userId, from, to],
  });
  const totalIncomeMinor = Number(incomeResult.rows[0]?.['total'] ?? 0);

  const expenseResult = await db.execute({
    sql: `SELECT COALESCE(SUM(amount_minor), 0) AS total
          FROM expenses
          WHERE user_id = ? AND spent_at >= ? AND spent_at < ?`,
    args: [userId, from, to],
  });
  const totalExpenseMinor = Number(expenseResult.rows[0]?.['total'] ?? 0);

  return {
    month,
    currency: 'UZS',
    totalIncomeMinor,
    totalExpenseMinor,
    balanceMinor: totalIncomeMinor - totalExpenseMinor,
  };
}

export async function getSummaryByCategory(
  userId: number,
  month: string
): Promise<{ month: string; items: SummaryByCategoryItem[] }> {
  const db = await getDatabase();
  const { from, to } = getMonthRange(month);

  const result = await db.execute({
    sql: `SELECT e.category_id, c.name, c.kind, SUM(e.amount_minor) AS total
          FROM expenses e
          JOIN categories c ON c.id = e.category_id
          WHERE e.user_id = ? AND e.spent_at >= ? AND e.spent_at < ?
          GROUP BY e.category_id, c.name, c.kind
          ORDER BY total DESC`,
    args: [userId, from, to],
  });

  const items: SummaryByCategoryItem[] = result.rows.map((row) => ({
    categoryId: Number(row.category_id),
    name: row.name as string,
    kind: row.kind as SummaryByCategoryItem['kind'],
    totalMinor: Number(row.total),
  }));

  return { month, items };
}

export async function getSummaryBySource(
  userId: number,
  month: string
): Promise<{ month: string; items: SummaryBySourceItem[] }> {
  const db = await getDatabase();
  const { from, to } = getMonthRange(month);

  const result = await db.execute({
    sql: `SELECT i.source_id, s.name, SUM(i.amount_minor) AS total
          FROM incomes i
          LEFT JOIN income_sources s ON s.id = i.source_id
          WHERE i.user_id = ? AND i.received_at >= ? AND i.received_at < ?
          GROUP BY i.source_id, s.name
          ORDER BY total DESC`,
    args: [userId, from, to],
  });

  const items: SummaryBySourceItem[] = result.rows.map((row) => ({
    sourceId: row.source_id != null ? Number(row.source_id) : null,
    name: row.name as string | null,
    totalMinor: Number(row.total),
  }));

  return { month, items };
}

export async function getRecurring(userId: number): Promise<RecurringResponse> {
  const db = await getDatabase();

  const expenseResult = await db.execute({
    sql: `SELECT e.category_id, c.name, e.amount_minor, e.recurrence
          FROM expenses e
          JOIN categories c ON c.id = e.category_id
          WHERE e.user_id = ? AND e.is_recurring = 1`,
    args: [userId],
  });

  const incomeResult = await db.execute({
    sql: `SELECT i.source_id, s.name, i.amount_minor, i.recurrence
          FROM incomes i
          LEFT JOIN income_sources s ON s.id = i.source_id
          WHERE i.user_id = ? AND i.is_recurring = 1`,
    args: [userId],
  });

  const items: RecurringItem[] = [];
  let monthlyExpenseMinor = 0;

  for (const row of expenseResult.rows) {
    const amountMinor = Number(row.amount_minor);
    const recurrence = row.recurrence as string;
    const monthlyAmount = recurrence === 'yearly'
      ? Math.round(amountMinor / 12)
      : amountMinor;

    monthlyExpenseMinor += monthlyAmount;

    items.push({
      type: 'expense',
      categoryId: Number(row.category_id),
      name: row.name as string,
      amountMinor,
      recurrence: recurrence as RecurringItem['recurrence'],
    });
  }

  for (const row of incomeResult.rows) {
    items.push({
      type: 'income',
      sourceId: row.source_id != null ? Number(row.source_id) : undefined,
      name: (row.name as string) || 'Источник удалён',
      amountMinor: Number(row.amount_minor),
      recurrence: row.recurrence as RecurringItem['recurrence'],
    });
  }

  return {
    monthlyExpenseMinor,
    items,
  };
}
