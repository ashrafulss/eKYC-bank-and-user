import type { Request, Response } from "express";
import { nidService } from "./nid.service.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

export const uploadNID = asyncHandler(async (req: Request, res: Response) => {
  const { frontImage, backImage } = req.body;

  if (!frontImage || !backImage) {
    res.status(400).json({ 
      success: false, 
      message: "Both Front and Back NID image assets are required." 
    });
    return;
  }

  const userId = req.customer?.id; 
  if (!userId) {
    res.status(401).json({ 
      success: false, 
      message: "Unauthorized profile request session context missing." 
    });
    return;
  }

  const result = await nidService.processNIDUploads(userId, frontImage, backImage);

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("reg_step", result.currentStep, {
    httpOnly: false, 
    secure: isProduction,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, 
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "NID documents processed and verified successfully.",
    data: {
      currentStep: result.currentStep,
      documents: result.documents
    }
  });
});