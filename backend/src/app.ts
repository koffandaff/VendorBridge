import cors from "cors";
import express from "express";
import helmet from "helmet";
import "./config/env.js";
import { API_PREFIX, BODY_LIMIT } from "./config/constants.js";
import { corsOrigins } from "./config/env.js";
import { NotFoundError } from "./core/errors/app-error.js";
import { errorMiddleware } from "./core/middleware/error.middleware.js";
import { requestLoggerMiddleware } from "./core/logger/request-logger.js";
import { requestIdMiddleware } from "./core/middleware/request-id.js";
import { authRouter } from "./modules/auth/index.js";
import { vendorRouter } from "./modules/vendors/index.js";
import { userRouter } from "./modules/users/index.js";
import { prisma } from "./shared/prisma.js";

export const app = express();

app.disable("x-powered-by");

// Baseline security & middleware setup (backend/rules.md §6)
app.use(helmet());
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: BODY_LIMIT }));

// Health Check Endpoint (backend/rules.md §23)
app.get("/health", async (_req, res) => {
  let database = "up";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }
  res.json({ status: "ok", database });
});

// API Routes (backend/rules.md §22)
app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/vendors`, vendorRouter);
app.use(`${API_PREFIX}/users`, userRouter);

// 404 Handler
app.use((_req, _res, next) => {
  next(new NotFoundError("Route not found"));
});

// Centralized Error Handling Middleware (backend/rules.md §7)
app.use(errorMiddleware);
