import { Router } from 'express';

const router = Router();

// REQUIRED FOR RENDER HEALTH CHECK
router.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// OPTIONAL HUMAN CHECK
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'medrise',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
