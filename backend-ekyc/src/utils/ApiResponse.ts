import type { Response } from "express";

interface ApiResponseOptions<T> {
  statusCode: number;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export class ApiResponse {
  static send<T>(res: Response, options: ApiResponseOptions<T>): void {
    const { statusCode, message, data, meta } = options;
    res.status(statusCode).json({
      success: statusCode < 400,
      message,
      ...(data !== undefined && { data }),
      ...(meta !== undefined && { meta }),
    });
  }

  static ok<T>(res: Response, data?: T, message = "Success"): void {
    this.send(res, { statusCode: 200, message, data });
  }

  static created<T>(res: Response, data?: T, message = "Created"): void {
    this.send(res, { statusCode: 201, message, data });
  }
}
