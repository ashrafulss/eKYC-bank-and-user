export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string | undefined;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", errorCode?: string) {
    super(message, 400, errorCode);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", errorCode?: string) {
    super(message, 401, errorCode);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", errorCode?: string) {
    super(message, 403, errorCode);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", errorCode?: string) {
    super(message, 404, errorCode);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", errorCode?: string) {
    super(message, 409, errorCode);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests", errorCode?: string) {
    super(message, 429, errorCode);
  }
}
