import { ensureApp } from '../backend/src/app';

export default async function handler(req: any, res: any) {
  try {
    const app = await ensureApp();
    app(req, res);
  } catch (err) {
    console.error('Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: ' Internal Server Error' }));
  }
}
