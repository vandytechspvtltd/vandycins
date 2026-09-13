import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { config } from "./config.js";
import api from "./routes/index.js";
import { optionalApiKey } from "./middleware/apiKey.js";
import { notFound, errorHandler } from "./middleware/errors.js";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";

const app = express();

app.disable("x-powered-by");

// ============================================================
// SECURITY
// ============================================================

app.use(helmet());

// ============================================================
// BODY PARSER
// ============================================================

app.use(express.json({ limit: "1mb" }));

// ============================================================
// CORS
// ============================================================

app.use(
  cors({
    origin(origin, cb) {
      // Android / server-to-server / non-browser requests
      if (!origin) {
        return cb(null, true);
      }

      // If no CORS origins configured, allow all
      if (config.corsOrigins.length === 0) {
        return cb(null, true);
      }

      if (config.corsOrigins.includes(origin)) {
        return cb(null, true);
      }

      return cb(new Error("CORS origin not allowed"));
    },
  })
);

// ============================================================
// RATE LIMIT
// ============================================================

app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// ============================================================
// ROOT
// ============================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    service: "vandycin-backend",
    status: "online",
    message: "VandyCins API is running",
    health: "/health",
    api: "/api/v1",
    docs: "/api-docs",
  });
});

// ============================================================
// HEALTH CHECK
// ============================================================

// Main health endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "vandycin-backend",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// API health endpoint
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "vandycin-backend",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// API V1 ROOT
// ============================================================

app.get("/api/v1", (req, res) => {
  res.status(200).json({
    success: true,
    service: "vandycin-backend",
    version: "v1",
    status: "online",
    message: "VandyCins API v1 is running",
  });
});

// ============================================================
// SWAGGER
// ============================================================

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// ============================================================
// API V1
// ============================================================

app.use(
  "/api/v1",
  optionalApiKey,
  api
);

// ============================================================
// 404 — ALWAYS LAST
// ============================================================

app.use(notFound);

// ============================================================
// ERROR HANDLER — ALWAYS LAST
// ============================================================

app.use(errorHandler);

export default app;