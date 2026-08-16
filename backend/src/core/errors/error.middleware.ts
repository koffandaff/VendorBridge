import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { env } from "../../config/env.js";
import { logger } from "../logger/logger.js";
import {
  AppError,
  ConflictError,
  DatabaseError,
  InternalServerError,
  NotFoundError,
  PayloadTooLargeError,
  ValidationError,
} from "./app-error.js";

function mapUnknownError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return new ConflictError("a record with that unique value already exists");
    }
    if (err.code === "P2025") {
      return new NotFoundError("requested record was not found");
    }
    return new DatabaseError();
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseError("database is unavailable");
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return new InternalServerError("invalid database operation");
  }

  if (typeof err === "object" && err !== null && "type" in err) {
    const type = (err as { type?: unknown }).type;
    if (type === "entity.too.large") {
      return new PayloadTooLargeError();
    }
    if (type === "entity.parse.failed") {
      return new ValidationError("malformed JSON in request body");
    }
  }

  return new InternalServerError();
}

export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const mapped = mapUnknownError(err);

  if (mapped.statusCode >= 500) {
    const diagnostic: Record<string, unknown> = {
      requestId: req.requestId,
      code: mapped.code,
      message: err instanceof Error ? err.message : String(err),
    };
    if (env.NODE_ENV !== "production" && err instanceof Error) {
      diagnostic.stack = err.stack;
    }
    logger.error("request failed", diagnostic);
  }

  res.status(mapped.statusCode).json({
    success: false,
    error: {
      code: mapped.code,
      message: mapped.message,
      ...(mapped.details !== undefined ? { details: mapped.details } : {}),
    },
  });
};