import { createClient, type Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

let client: Client | null = null;
let initialized = false;

export async function getDatabase(): Promise<Client> {
  if (!client) {
    const isLocal = !env.TURSO_DATABASE_URL || env.TURSO_DATABASE_URL === '';

    if (isLocal) {
      client = createClient({ url: `file:${env.DATABASE_URL}` });
    } else {
      client = createClient({
        url: env.TURSO_DATABASE_URL,
        authToken: env.TURSO_AUTH_TOKEN || undefined,
      });
    }

    if (!initialized) {
      await initializeSchema();
      await seedSystemCategories();
      initialized = true;
    }
  }
  return client;
}

export function getDatabaseSync(): Client {
  if (!client) {
    throw new Error('Database not initialized. Call getDatabase() first.');
  }
  return client;
}

async function initializeSchema(): Promise<void> {
  const db = client!;
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    await db.execute(stmt);
  }
}

const systemCategories = [
  { kind: 'subscription', name: 'Подписки' },
  { kind: 'utility', name: 'Коммуналка' },
  { kind: 'groceries', name: 'Продукты' },
  { kind: 'rent', name: 'Аренда' },
  { kind: 'other', name: 'Прочее' },
] as const;

async function seedSystemCategories(): Promise<void> {
  const db = client!;

  const result = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM categories WHERE user_id IS NULL',
    args: [],
  });

  const count = (result.rows[0]?.['count'] as number) ?? 0;
  if (count > 0) return;

  for (const cat of systemCategories) {
    await db.execute({
      sql: 'INSERT INTO categories (user_id, name, kind, icon, color) VALUES (NULL, ?, ?, NULL, NULL)',
      args: [cat.name, cat.kind],
    });
  }

  console.log('System categories seeded.');
}
