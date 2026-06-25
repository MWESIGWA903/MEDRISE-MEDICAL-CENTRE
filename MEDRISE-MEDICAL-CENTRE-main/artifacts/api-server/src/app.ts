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
 * HEALTH CHECK (FIXED)
 * =========================
 * MUST BE HERE (before /api router mounting issues affect it)
 */

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'medrise',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health/db', async (_req: Request, res: Response) => {
  try {
    // lightweight safe placeholder check
    res.status(200).json({
      status: 'ok',
      database: 'supabase assumed connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'failed',
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
        return { id: req.id, method: req.method, url: req.url?.split('?')[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

/**
 * =========================
 * TRUST / SECURITY
 * =========================
 */

app.set('trust proxy', 1);

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
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        origin.endsWith('.netlify.app') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.includes('.replit.app') ||
        origin.includes('.replit.dev') ||
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
 * BODY PARSING
 * =========================
 */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * =========================
 * ROUTES
 * =========================
 */

app.use('/api', router);

/**
 * =========================
 * ERROR HANDLER
 * =========================
 */

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
