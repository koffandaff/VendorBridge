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
import { usersRouter } from "./modules/users/index.js";
import { notificationsRouter } from "./modules/notifications/index.js";
import { auditLogsRouter } from "./modules/audit-logs/index.js";
import { dashboardRouter } from "./modules/dashboard/index.js";
import { prisma } from "./shared/prisma.js";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: BODY_LIMIT }));

app.get("/health", async (_req, res) => {
  let database = "up";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }

  res.json({ status: "ok", database });
});

app.use(`${API_PREFIX}/auth`, authRouter);

// Vendor routes
app.use("/api/v1/vendors", vendorRouter);

// Admin routes
app.use(`${API_PREFIX}/users`, usersRouter);
app.use(`${API_PREFIX}/notifications`, notificationsRouter);
app.use(`${API_PREFIX}/audit-logs`, auditLogsRouter);
app.use(`${API_PREFIX}/dashboard`, dashboardRouter);

app.use((_req, _res, next) => {
  next(new NotFoundError("route not found"));
});

app.use(errorMiddleware);
