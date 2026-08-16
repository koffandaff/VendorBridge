import express from "express";
import { vendorRouter } from "./modules/vendors/index.js";
import { rfqRouter } from "./modules/rfqs/index.js";
import { quotationRouter } from "./modules/quotations/index.js";
import { purchaseOrderRouter } from "./modules/purchase-orders/index.js";
import { invoiceRouter } from "./modules/invoices/index.js";
import { errorMiddleware } from "./core/middleware/error.middleware.js";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API Routes
app.use("/api/v1/vendors", vendorRouter);
app.use("/api/v1/rfqs", rfqRouter);
app.use("/api/v1/quotations", quotationRouter);
app.use("/api/v1/purchase-orders", purchaseOrderRouter);
app.use("/api/v1/invoices", invoiceRouter);

// Centralized Error Handling Middleware (must be registered after routes)
app.use(errorMiddleware);
