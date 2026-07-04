import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import routes from './server/routes';
import { initDb } from './server/db';

async function startServer() {
  // Initialize SQLite Database tables
  try {
    initDb();
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }

  const app = express();
  const PORT = 3000;

  // Custom CORS Middleware to allow requests from the deployed frontend
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow any origin in dev or if origin is provided, or restrict to specific domains if needed
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight OPTIONS requests immediately
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Setup JSON body parsing middleware
  app.use(express.json());

  // Register RESTful API routes under /api
  app.use('/api', routes);

  // Setup Vite development server or production static assets serving
  if (process.env.NODE_ENV !== 'production') {
    console.log('Mounting Vite dev middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production static files...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Critical server startup error:', err);
});
