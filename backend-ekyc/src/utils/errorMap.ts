import {
  AppError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} from "./AppError.js";

const OTP_ERROR_MAP: Record<string, () => AppError> = {
  NO_RECORD: () =>
    new NotFoundError("No active verification request found", "NO_RECORD"),
  ATTEMPTS_EXCEEDED: () =>
    new BadRequestError(
      "Maximum attempts exceeded. Request a new code.",
      "ATTEMPTS_EXCEEDED",
    ),
  EXPIRED: () =>
    new BadRequestError("Verification code has expired", "EXPIRED"),
  INVALID_CODE: () =>
    new BadRequestError("Invalid verification code", "INVALID_CODE"),
  INVALID_REFRESH_TOKEN: () =>
    new UnauthorizedError("Invalid refresh token", "INVALID_REFRESH_TOKEN"),
  SESSION_REVOKED: () =>
    new UnauthorizedError(
      "Session expired. Please log in again.",
      "SESSION_REVOKED",
    ),
};

export const mapServiceError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;

  if (error instanceof Error) {
    const factory = OTP_ERROR_MAP[error.message];
    if (factory) {
      return factory();
    }
  }

  return new AppError(
    error instanceof Error ? error.message : "Internal server error",
    500,
  );
};
