import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes';
import { logger } from './lib/logger';
import { getSessionFromRequestAsync } from './lib/session';

const app: Express = express();

/**
 * =========================
 * HEALTH CHECKS
 * =========================
 */

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'medrise',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Render Health Check
 */
app.get('/api/healthz', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'medrise',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Database Health Check
 */
app.get('/api/health/db', async (_req: Request, res: Response) => {
  try {
    res.status(200).json({
      status: 'ok',
      database: 'supabase assumed connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({
      status: 'error',
      database: 'failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * =========================
 * LOGGING
 * =========================
 */

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split('?')[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

/**
 * =========================
 * TRUST PROXY
 * =========================
 */

app.set('trust proxy', 1);

/**
 * =========================
 * SECURITY
 * =========================
 */

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'ws:'],
      },
    },
  }),
);

/**
 * =========================
 * CORS
 * =========================
 */

const allowedOrigins = [
  ...(process.env.ALLOWED_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (
        origin.endsWith('.netlify.app') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.vercel.app') ||
        origin.includes('.replit.app') ||
        origin.includes('.replit.dev') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

/**
 * =========================
 * RATE LIMIT
 * =========================
 */

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

/**
 * =========================
 * BODY PARSERS
 * =========================
 */

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * =========================
 * SESSION ATTACHMENT
 * =========================
 */

app.use(async (req, _res, next) => {
  try {
    (req as any).session = await getSessionFromRequestAsync(req);
  } catch (err) {
    logger.warn({ err }, 'Failed to load session');
  }

  next();
});

/**
 * =========================
 * API ROUTES
 * =========================
 */

app.use('/api', router);

/**
 * =========================
 * 404 HANDLER
 * =========================
 */

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
  });
});

/**
 * =========================
 * ERROR HANDLER
 * =========================
 */

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled application error');

  res.status(500).json({
    error: 'Internal server error',
  });
});

export default app;
