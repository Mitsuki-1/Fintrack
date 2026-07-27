import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Некорректный формат email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  displayName: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});