import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'medrise',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/healthz
 * Used by Render internal health checks.
 */
router.get('/healthz', (_req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

export default router;
