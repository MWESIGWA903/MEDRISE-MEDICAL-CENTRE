import { Router } from 'express';

const router = Router();

router.get('/healthz', (_req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'medrise',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/db', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    database: 'assumed connected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
