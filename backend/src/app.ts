import cors from "cors";
import express from "express";
import helmet from "helmet";
import * as helmetModule from "helmet";
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
import { rfqRouter } from "./modules/rfqs/index.js";
import { quotationRouter } from "./modules/quotations/index.js";
import { purchaseOrderRouter } from "./modules/purchase-orders/index.js";
import { invoiceRouter } from "./modules/invoices/index.js";
import { notificationsRouter } from "./modules/notifications/index.js";
import { auditLogsRouter } from "./modules/audit-logs/index.js";
import { dashboardRouter } from "./modules/dashboard/index.js";
import { prisma } from "./shared/prisma.js";

export const app = express();

app.disable("x-powered-by");

// Baseline security & middleware setup (backend/rules.md §6)
const helmetMiddleware = (helmetModule as { default?: typeof helmet }).default ?? helmet;
app.use(helmetMiddleware());
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
app.use(`${API_PREFIX}/users`, usersRouter);

// Procurement routes
app.use(`${API_PREFIX}/rfqs`, rfqRouter);
app.use(`${API_PREFIX}/quotations`, quotationRouter);
app.use(`${API_PREFIX}/purchase-orders`, purchaseOrderRouter);
app.use(`${API_PREFIX}/invoices`, invoiceRouter);

// Admin routes
app.use(`${API_PREFIX}/notifications`, notificationsRouter);
app.use(`${API_PREFIX}/audit-logs`, auditLogsRouter);
app.use(`${API_PREFIX}/dashboard`, dashboardRouter);

// 404 Handler
app.use((_req, _res, next) => {
  next(new NotFoundError("Route not found"));
});

// Centralized Error Handling Middleware (backend/rules.md §7)
app.use(errorMiddleware);