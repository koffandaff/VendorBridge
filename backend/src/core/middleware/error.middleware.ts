/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { sendError } from "../http/response.js";

// Express error middleware requires a 4-argument signature (err, req, res, next)
export const errorMiddleware: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.name, err.details);
    return;
  }

  // Handle unexpected errors without leaking internal implementation details
  console.error("Unhandled Error:", err);
  
  const isProduction = process.env.NODE_ENV === "production";
  const message = isProduction
    ? "An unexpected internal server error occurred"
    : err.message || "Internal Server Error";

  sendError(res, message, 500, "INTERNAL_SERVER_ERROR");
};
