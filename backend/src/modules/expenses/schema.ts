import { z } from 'zod';

export const createExpenseSchema = z.object({
  categoryId: z.number().int().positive('Необходимо указать категорию'),
  amountMinor: z.number().int().positive('Сумма должна быть положительным числом'),
  currency: z.string().length(3).default('UZS'),
  spentAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата должна быть в формате YYYY-MM-DD'),
  description: z.string().max(500).nullable().optional(),
  isRecurring: z.boolean().default(false),
  recurrence: z.enum(['monthly', 'yearly']).nullable().optional(),
});

export const updateExpenseSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  amountMinor: z.number().int().positive('Сумма должна быть положительным числом').optional(),
  currency: z.string().length(3).optional(),
  spentAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата должна быть в формате YYYY-MM-DD').optional(),
  description: z.string().max(500).nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurrence: z.enum(['monthly', 'yearly']).nullable().optional(),
});

export const getExpensesQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});