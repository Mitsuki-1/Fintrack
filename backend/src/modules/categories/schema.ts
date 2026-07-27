import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  kind: z.enum(['subscription', 'utility', 'groceries', 'rent', 'other']).default('other'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  kind: z.enum(['subscription', 'utility', 'groceries', 'rent', 'other']).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
});