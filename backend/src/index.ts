import { env } from './config/env';
import { ensureApp } from './app';

async function main() {
  const app = await ensureApp();

  app.listen(env.PORT, () => {
    console.log(`🚀 FinTrack API запущен на http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('Ошибка запуска сервера:', err);
  process.exit(1);
});
