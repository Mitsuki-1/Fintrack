import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/error';
import { getDatabase } from './db/client';
import authRoutes from './modules/auth/routes';
import incomeSourceRoutes from './modules/income-sources/routes';
import incomeRoutes from './modules/incomes/routes';
import categoryRoutes from './modules/categories/routes';
import expenseRoutes from './modules/expenses/routes';
import summaryRoutes from './modules/summary/routes';

let appReady = false;

async function ensureApp(): Promise<express.Express> {
  if (!appReady) {
    await getDatabase();
    appReady = true;
  }

  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());

  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
      error: { code: 'RATE_LIMIT', message: 'Слишком много запросов, попробуйте позже' },
    },
  });
  app.use('/api/auth', authLimiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/income-sources', incomeSourceRoutes);
  app.use('/api/incomes', incomeRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/summary', summaryRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(errorHandler);

  return app;
}

export { ensureApp };
