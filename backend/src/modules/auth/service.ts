import bcrypt from 'bcryptjs';
import { getDatabase } from '../../db/client';
import { signToken } from '../../utils/jwt';
import { AppError } from '../../middleware/error';
import type { UserResponse } from '../../types';

function rowToUser(row: Record<string, any>): UserResponse {
  return {
    id: Number(row.id),
    email: row.email as string,
    displayName: row.display_name as string | null,
    defaultCurrency: row.default_currency as string,
    createdAt: row.created_at as string,
  };
}

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: UserResponse; token: string }> {
  const db = await getDatabase();

  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [email],
  });
  if (existing.rows.length > 0) {
    throw new AppError(409, 'CONFLICT', 'Пользователь с таким email уже существует');
  }

  const hash = await bcrypt.hash(password, 12);
  const insertResult = await db.execute({
    sql: 'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
    args: [email, hash, displayName || null],
  });

  const userId = Number(insertResult.lastInsertRowid);

  const userResult = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [userId],
  });

  const token = signToken(userId);
  return { user: rowToUser(userResult.rows[0]), token };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: UserResponse; token: string }> {
  const db = await getDatabase();

  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email],
  });

  if (result.rows.length === 0) {
    throw new AppError(401, 'UNAUTHORIZED', 'Неверный email или пароль');
  }

  const user = result.rows[0];
  const storedPassword = user.password_hash as string;

  const valid = await bcrypt.compare(password, storedPassword);
  if (!valid) {
    throw new AppError(401, 'UNAUTHORIZED', 'Неверный email или пароль');
  }

  const userId = Number(user.id);
  const token = signToken(userId);
  return { user: rowToUser(user), token };
}

export async function me(userId: number): Promise<UserResponse> {
  const db = await getDatabase();

  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [userId],
  });

  if (result.rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Пользователь не найден');
  }

  return rowToUser(result.rows[0]);
}
