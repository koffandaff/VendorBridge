import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";
import { ValidationError } from "../errors/AppError.js";
import { sanitizeInput } from "../../shared/validators/sanitize.js";

export interface RequestValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validateRequest(schemas: RequestValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (req.body) {
        req.body = sanitizeInput(req.body);
      }
      if (req.query) {
        defineRequestProperty(req, "query", sanitizeInput(req.query));
      }
      if (req.params) {
        defineRequestProperty(req, "params", sanitizeInput(req.params));
      }

      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        defineRequestProperty(req, "query", schemas.query.parse(req.query));
      }
      if (schemas.params) {
        defineRequestProperty(req, "params", schemas.params.parse(req.params));
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        next(new ValidationError("Invalid request data", formattedErrors));
      } else {
        next(error);
      }
    }
  };
}

// Express 5 defines req.query (and possibly req.params) as getter-only properties.
function defineRequestProperty(
  req: Request,
  key: "query" | "params",
  value: unknown
): void {
  Object.defineProperty(req, key, {
    value,
    configurable: true,
    enumerable: true,
    writable: true,
  });
}
