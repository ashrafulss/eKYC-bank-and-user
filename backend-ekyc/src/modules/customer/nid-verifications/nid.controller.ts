import type { Request, Response } from "express";
import { nidService } from "./nid.service.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { BadRequestError, UnauthorizedError } from "../../../utils/AppError.js";

export const uploadNID = asyncHandler(async (req: Request, res: Response) => {
  const { frontImage, backImage } = req.body;

  if (!frontImage || !backImage) {
    throw new BadRequestError("Both Front and Back NID image assets are required.");
  }

  const userId = req.customer?.id; 
  if (!userId) {
    throw new UnauthorizedError("Unauthorized profile request session context missing.");
  }

  // Execute processing logic
  const result = await nidService.processNIDUploads(userId, frontImage, backImage);

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