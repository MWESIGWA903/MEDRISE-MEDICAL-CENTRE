import { Router } from 'express';

const router = Router();

/**
 * Main health endpoint
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
 * Legacy health check (optional fallback)
 * GET /api/healthz
 */
router.get('/healthz', (_req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

export default router;
