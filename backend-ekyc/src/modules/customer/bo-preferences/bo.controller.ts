import type { Request, Response } from "express";
import { boService } from "./bo.service.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { BadRequestError, UnauthorizedError } from "../../../utils/AppError.js";

export const saveBoPreferences = asyncHandler(async (req: Request, res: Response) => {
  const {
    accountType,
    depositoryParticipant,
    bankName,
    settlementAccount,
    tinNumber,
    permissionCash,
    permissionMargin,
    permissionForeign,
  } = req.body;

  // Basic payload validation
  if (!accountType || !depositoryParticipant || !bankName || !settlementAccount) {
    throw new BadRequestError("Required BO configuration data values are missing.");
  }

  const userId = req.customer?.id;
  if (!userId) {
    throw new UnauthorizedError("Unauthorized request session context missing.");
  }

  // Pass configuration object downstream
  const result = await boService.updateBoPreferences(userId, {
    accountType,
    depositoryParticipant,
    bankName,
    settlementAccount,
    tinNumber,
    permissionCash: !!permissionCash,
    permissionMargin: !!permissionMargin,
    permissionForeign: !!permissionForeign,
  });

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("reg_step", result.currentStep, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });

  ApiResponse.ok(
    res,
    { currentStep: result.currentStep },
    "BO account configuration preferences updated successfully."
  );
});