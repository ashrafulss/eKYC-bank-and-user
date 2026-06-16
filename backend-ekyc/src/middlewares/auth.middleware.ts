// src/middlewares/auth.middleware.ts
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../utils/AppError.js";

export const userAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    next(new UnauthorizedError("Authentication required"));
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.customer = decoded;
    next();
  } catch {
    next(new UnauthorizedError("Access token expired or invalid"));
  }
};
