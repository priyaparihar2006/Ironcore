import { verifyWeightNotation } from './server/inputValidation.js';
import { publicErrorHandler } from './server/httpErrors.js';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/api.js';
import { getDatabase } from './server/db.js';

// Resolve paths relative to THIS file rather than process.cwd(), so the server
// behaves the same regardless of the directory it's launched from.
// In dev, tsx runs this as real ESM, where only `import.meta.url` exists.
// In production, esbuild bundles it to a single CJS file; there, Node's CJS
// module wrapper injects a real local `__dirname` (it is NOT a globalThis
// property) and `import.meta.url` is empty (esbuild cannot resolve import.meta
// for cjs output) — so prefer that local `__dirname` when it's defined, and
// only fall back to import.meta.url in real ESM.
function resolveAppDir(): string {
  if (typeof __dirname !== 'undefined') return __dirname;
  return path.dirname(fileURLToPath(import.meta.url));
}
const appDir = resolveAppDir();

const isProduction = process.env.NODE_ENV === 'production';

// Minimal, dependency-free request logger. Deliberately logs ONLY method,
// path, status code, duration, and timestamp — never headers or the request
// body, so it can never leak passwords, JWTs, reset tokens, or Authorization
// headers.
function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
}

// Production-safe global error handler. Must be registered LAST (after every
// route and the SPA fallback) — Express recognizes an error handler by its
// 4-argument signature. Never leaks a stack trace or internal error detail to
// the client in production; always logs server-side (without ever including
// request bodies, so passwords/tokens/secrets can't end up in logs this way).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function globalErrorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  publicErrorHandler(err, req, res, _next);
}

async function startServer() {
  const app = express();
  // Platforms that host Node apps (Cloud Run, Render, Heroku, ...) inject their
  // own PORT; fall back to 5000 for local development.
  const PORT = Number(process.env.PORT) || 5000;

  // Most production hosts (Render, Railway, etc.) sit this app behind one
  // reverse proxy. Without this, express-rate-limit would key its limits off
  // the proxy's IP for every visitor (rate-limiting everyone together) instead
  // of each real client — "1" means "trust exactly one hop in front of us",
  // which is correct for a single reverse proxy and harmless with no proxy
  // at all (e.g. running locally).
  app.set('trust proxy', 1);

  // Security headers. CSP and Cross-Origin-Embedder-Policy are disabled here
  // because this app loads Google Fonts cross-origin and, in development,
  // relies on Vite's inline/eval-based HMR client — a default CSP would break
  // both. Every other helmet default (X-Content-Type-Options, X-Frame-Options,
  // HSTS, Referrer-Policy, etc.) stays enabled.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(requestLogger);

  // Cross-Origin Resource Sharing (CORS)
  // Required when the frontend is deployed separately (e.g. Vercel) or runs on a
  // separate local dev port (e.g. Vite on 5173). Handles preflight OPTIONS requests cleanly.
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

  // Body parsing middleware
  app.use(express.json({ limit: '10mb', verify: verifyWeightNotation }));
  app.use(express.urlencoded({ extended: true }));

  // API routes mounted FIRST
  app.use('/api', apiRouter);

  // Health check — used by hosting platforms to decide if this instance is
  // healthy. Responds fast, never exposes secrets, and reports 503 if the
  // database itself isn't reachable (getDatabase() is cheap after the first
  // call — it just returns the already-hydrated in-memory copy).
  app.get('/api/health', async (_req, res) => {
    try {
      await getDatabase();
      res.json({ status: 'ok', service: 'IronCore API', database: 'connected', timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('[health] Database unavailable:', err instanceof Error ? err.message : err);
      res
        .status(503)
        .json({ status: 'error', service: 'IronCore API', database: 'unavailable', timestamp: new Date().toISOString() });
    }
  });

  // Any /api/* path that didn't match a real route gets a proper JSON 404
  // instead of falling through to the SPA catch-all below (which would
  // otherwise return index.html with a 200 for a mistyped or unknown API
  // path — a real bug this project has hit before with static assets).
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  if (!isProduction) {
    // Vite is a devDependency and must never be required in production — import
    // it dynamically, and only inside this branch, so a production start never
    // even attempts to load it (see the `else` branch below).
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // `npm run build` outputs the built frontend AND the bundled server into the
    // same dist/ folder (dist/server.cjs sits next to dist/index.html), so the
    // built assets always live alongside this running file.
    const distPath = appDir;
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler — must be the LAST middleware registered.
  app.use(globalErrorHandler);

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `IronCore server running on http://0.0.0.0:${PORT} [${isProduction ? 'production' : 'development'}]`
    );
  });

  // Graceful shutdown on SIGTERM (sent by hosting platforms / process
  // managers on redeploy or restart) — stop accepting new connections, let
  // in-flight requests finish, then exit cleanly.
  process.on('SIGTERM', () => {
    console.log('[shutdown] SIGTERM received, closing server...');
    server.close(() => {
      console.log('[shutdown] Server closed.');
      process.exit(0);
    });
  });
}

// Safety nets for errors that would otherwise silently crash or hang the
// process. Never log the error object's raw request/body data here — only
// the error itself, which never includes passwords/tokens by construction
// (routes are not passed to these handlers).
process.on('uncaughtException', (err) => {
  console.error('[fatal] Uncaught exception:', err);
  // The process is in an unknown state after a truly uncaught exception —
  // exit so a process manager / hosting platform can restart it cleanly.
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[fatal] Unhandled promise rejection:', reason);
  // Logged, not fatal: an unhandled rejection inside a single request
  // handler shouldn't take down a server that's otherwise serving other
  // requests fine.
});

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
