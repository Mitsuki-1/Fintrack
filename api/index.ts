import serverless from 'serverless-http';
import { ensureApp } from '../backend/src/app';

let handler: any;

export default async function(req: any, res: any) {
  if (!handler) {
    const app = await ensureApp();
    handler = serverless(app);
  }
  return handler(req, res);
}
