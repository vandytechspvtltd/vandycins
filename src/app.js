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

app.use(helmet());

app.use(express.json({ limit: "1mb" }));

app.use(
  cors({
    origin(origin, cb) {
      if (
        !origin ||
        config.corsOrigins.length === 0 ||
        config.corsOrigins.includes(origin)
      ) {
        return cb(null, true);
      }

      cb(new Error("CORS origin not allowed"));
    },
  })
);

app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// Health
app.get("/health", (req, res) =>
  res.json({
    success: true,
    service: "vandycin-backend",
    status: "ok",
    timestamp: new Date().toISOString(),
  })
);

// Swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// API
app.use("/api/v1", optionalApiKey, api);

// 404 — ALWAYS LAST
app.use(notFound);

// Error handler — LAST
app.use(errorHandler);

export default app;