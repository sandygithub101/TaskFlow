import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import taskRoutes from './server/routes/taskRoutes';
import userRoutes from './server/routes/userRoutes';
import dashboardRoutes from './server/routes/dashboardRoutes';
import externalRoutes from './server/routes/externalRoutes';
import { getDatabase } from './server/database/sqlite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database
  await getDatabase();

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api/tasks', taskRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/external', externalRoutes);

  // Vite Middleware / Static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskFlow Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
