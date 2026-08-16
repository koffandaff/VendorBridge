import express from "express";
import { vendorRouter } from "./modules/vendors/index.js";
import { errorMiddleware } from "./core/middleware/error.middleware.js";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API Routes
app.use("/api/v1/vendors", vendorRouter);

// Centralized Error Handling Middleware (must be registered after routes)
app.use(errorMiddleware);
