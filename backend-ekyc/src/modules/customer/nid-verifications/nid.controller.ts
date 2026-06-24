import type { Request, Response } from "express";
import { nidService } from "./nid.service.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { BadRequestError, UnauthorizedError } from "../../../utils/AppError.js";

export const uploadNID = asyncHandler(async (req: Request, res: Response) => {
  // 1. Auth check FIRST
  const userId = req.customer?.id;
  const mobile = req.customer?.mobile;  


  if (!userId || !mobile) {
    throw new UnauthorizedError("Unauthorized profile request session context missing.");
  }

  // 2. Body validation AFTER auth
  const { frontImage, backImage } = req.body;

  if (!frontImage) {
    throw new BadRequestError("Front NID image is required.");
  }

  if (!backImage) {
    throw new BadRequestError("Back NID image is required.");
  }

  // 3. Pass mobile from JWT into service
  const result = await nidService.processNIDUploads(userId, frontImage, backImage, mobile);

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
    {
      currentStep: result.currentStep,
      documents: result.documents,
    },
    "NID documents processed and verified successfully."
  );
});