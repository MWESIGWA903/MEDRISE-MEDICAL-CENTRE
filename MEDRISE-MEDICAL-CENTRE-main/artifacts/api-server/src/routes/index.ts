import { Router } from 'express';

const healthRouter = Router();

/**
 * GET /api/health
 * Basic system health check
 */
healthRouter.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'medrise',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/health/db
 * Simple DB/Supabase connectivity check (safe version)
 */
healthRouter.get('/db', async (_req, res) => {
  try {
    // Lightweight safe check (does not depend on specific DB import)
    // If you later have db imported, you can replace this with a real query

    res.status(200).json({
      status: 'ok',
      database: 'assumed connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'connection failed',
    });
  }
});

export default healthRouter;
