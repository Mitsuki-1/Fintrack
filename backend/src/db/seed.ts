import { getDatabase } from './client';

export async function seed(): Promise<void> {
  const db = await getDatabase();

  const result = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM categories WHERE user_id IS NULL',
    args: [],
  });

  const count = (result.rows[0]?.['count'] as number) ?? 0;
  if (count > 0) {
    console.log('System categories already exist, skipping.');
    return;
  }

  const systemCategories = [
    { kind: 'subscription', name: 'Подписки' },
    { kind: 'utility', name: 'Коммуналка' },
    { kind: 'groceries', name: 'Продукты' },
    { kind: 'rent', name: 'Аренда' },
    { kind: 'other', name: 'Прочее' },
  ] as const;

  for (const cat of systemCategories) {
    await db.execute({
      sql: 'INSERT INTO categories (user_id, name, kind, icon, color) VALUES (NULL, ?, ?, NULL, NULL)',
      args: [cat.name, cat.kind],
    });
  }

  console.log('System categories created.');
}
