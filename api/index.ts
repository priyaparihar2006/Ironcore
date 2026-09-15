import express from 'express';
import helmet from 'helmet';
import { apiRouter } from '../server/api.js';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['*'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Error Handler for Vercel Serverless Function
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Vercel API Error]', err);
  if (res.headersSent) return;
  const message = err?.message || 'Internal Server Error';
  res.status(500).json({ error: message });
});

export default app;
