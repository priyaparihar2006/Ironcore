import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/api.js';

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

async function startServer() {
  const app = express();
  // Platforms that host Node apps (Cloud Run, Render, Heroku, ...) inject their
  // own PORT; fall back to 5000 for local development.
  const PORT = Number(process.env.PORT) || 5000;

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API routes mounted FIRST
  app.use('/api', apiRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'IronCore API', timestamp: new Date().toISOString() });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `IronCore server running on http://0.0.0.0:${PORT} [${isProduction ? 'production' : 'development'}]`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
