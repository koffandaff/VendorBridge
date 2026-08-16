export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation Error", details?: unknown) {
    super(message, 400, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request", details?: unknown) {
    super(message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication Required", details?: unknown) {
    super(message, 401, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Permission Denied", details?: unknown) {
    super(message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource Not Found", details?: unknown) {
    super(message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource Conflict", details?: unknown) {
    super(message, 409, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Database Error", details?: unknown) {
    super(message, 500, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = "External Service Error", details?: unknown) {
    super(message, 502, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal Server Error", details?: unknown) {
    super(message, 500, details);
  }
}
