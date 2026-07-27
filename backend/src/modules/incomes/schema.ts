import { z } from 'zod';

export const createIncomeSchema = z.object({
  sourceId: z.number().int().positive().nullable().optional(),
  amountMinor: z.number().int().positive('Сумма должна быть положительным числом'),
  currency: z.string().length(3).default('UZS'),
  receivedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата должна быть в формате YYYY-MM-DD'),
  note: z.string().max(500).nullable().optional(),
  isRecurring: z.boolean().default(false),
  recurrence: z.enum(['monthly', 'yearly']).nullable().optional(),
});

export const updateIncomeSchema = z.object({
  sourceId: z.number().int().positive().nullable().optional(),
  amountMinor: z.number().int().positive('Сумма должна быть положительным числом').optional(),
  currency: z.string().length(3).optional(),
  receivedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата должна быть в формате YYYY-MM-DD').optional(),
  note: z.string().max(500).nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurrence: z.enum(['monthly', 'yearly']).nullable().optional(),
});

export const getIncomesQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sourceId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});