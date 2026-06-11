import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";
import { getSessionFromRequestAsync } from "./lib/session";

const app: Express = express();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait 15 minutes and try again." },
  skip: () => process.env.NODE_ENV === "test",
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded. Please slow down." },
  skip: () => process.env.NODE_ENV === "test",
});

const publicFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions from this device. Please wait an hour and try again." },
  skip: () => process.env.NODE_ENV === "test",
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "ws:"],
      },
    },
  }),
);

const allowedOrigins = [
  ...(process.env.ALLOWED_ORIGIN ?? "").split(",").map((o) => o.trim()).filter(Boolean),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin.endsWith(".netlify.app") ||
        origin.endsWith(".onrender.com") ||
        origin.endsWith(".vercel.app") ||
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1") ||
        origin.includes(".replit.app") ||
        origin.includes(".replit.dev") ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", globalLimiter);
app.use("/api/admin/login", loginLimiter);
app.use("/api/appointments", publicFormLimiter);
app.use("/api/feedback", publicFormLimiter);

const PUBLIC_PATHS: Array<{ method: string; path: string | RegExp }> = [
  { method: "GET",  path: "/healthz" },
  { method: "POST", path: "/admin/login" },
  { method: "POST", path: "/admin/password-reset/request" },
  { method: "POST", path: "/admin/password-reset/confirm" },
  { method: "POST", path: "/appointments" },
  { method: "GET",  path: "/appointments" },
  { method: "POST", path: "/feedback" },
  { method: "GET",  path: "/patients" },
  { method: "GET",  path: /^\/patients\/\d+$/ },
];

async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const isPublic = PUBLIC_PATHS.some((p) => {
    const methodMatch = p.method === req.method;
    const pathMatch = typeof p.path === "string" ? p.path === req.path : p.path.test(req.path);
    return methodMatch && pathMatch;
  });
  if (isPublic) { next(); return; }

  const session = await getSessionFromRequestAsync(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as Request & { adminSession: typeof session }).adminSession = session;
  next();
}

app.use("/api", requireAuth);
app.use("/api", router);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
