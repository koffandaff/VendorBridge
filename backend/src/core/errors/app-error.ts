export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DATABASE_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_SERVER_ERROR"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMIT_EXCEEDED";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;
  readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: ErrorCode, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export class ValidationError extends AppError {
  constructor(message = "validation failed", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "authentication failed") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "resource conflict") {
    super(message, 409, "CONFLICT");
  }
}

export class DatabaseError extends AppError {
  constructor(message = "database operation failed") {
    super(message, 500, "DATABASE_ERROR");
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = "external service failed") {
    super(message, 502, "EXTERNAL_SERVICE_ERROR");
  }
}

export class InternalServerError extends AppError {
  constructor(message = "an unexpected error occurred") {
    super(message, 500, "INTERNAL_SERVER_ERROR");
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = "request payload too large") {
    super(message, 413, "PAYLOAD_TOO_LARGE");
  }
}