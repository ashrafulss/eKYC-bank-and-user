import type { Request, Response } from "express";
import { selfieService } from "./selfie.service.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js"; // 👈 Ensure correct import path
import { BadRequestError, UnauthorizedError } from "../../../utils/AppError.js";


export const verifySelfie = asyncHandler(async (req: Request, res: Response) => {
  const { selfieImage } = req.body;

  if (!selfieImage) {
    throw new BadRequestError("Selfie image is required.");
  }
 
  const userId = req.customer?.id;
  if (!userId) {
    throw new UnauthorizedError("Unauthorized context or expired session.");
  }
 
  const result = await selfieService.processSelfie(userId, selfieImage);
 
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
      currentStep:    result.currentStep,
      livenessScore:  result.livenessScore,
      livenessPass:   result.livenessPass,
      faceMatchScore: result.faceMatchScore,
      faceMatchPass:  result.faceMatchPass,
      overallPass:    result.overallPass,
    },
    "Selfie verification completed successfully"
  );
});