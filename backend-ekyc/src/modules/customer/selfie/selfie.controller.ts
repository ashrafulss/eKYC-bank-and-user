import type { Request, Response } from "express";
import { selfieService } from "./selfie.service.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { BadRequestError, UnauthorizedError } from "../../../utils/AppError.js";

export const verifyLiveness = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.customer?.id;
  if (!userId) throw new UnauthorizedError("Unauthorized context or expired session.");

  // video comes from multer as req.file
  if (!req.file) throw new BadRequestError("Video file is required.");

  const { reference_id, mobile_number, actions } = req.body;
  if (!reference_id)  throw new BadRequestError("reference_id is required.");
  if (!mobile_number) throw new BadRequestError("mobile_number is required.");

  const parsedActions: string[] = actions
    ? JSON.parse(actions).actions ?? ["UP"]
    : ["UP"];

// ─── Update This Section In selfie.controller.ts ───────────────────

  const result = await selfieService.processLiveness(
    userId,
    req.file.buffer,
    reference_id,
    mobile_number,
    parsedActions,
  );

  // FROM THIS:
  // ApiResponse.ok(res, result, "Liveness verification completed.");

  // TO THIS (Bypasses wrapper to send raw structure):
  res.status(200).json({
    serviceType: "VIDEO_LIVENESS_v3",
    status: "SUCCESS",
    message: "Image capture SUCCESSFUL",
    requestId: reference_id,
    videoSizeBytes_mb: (req.file.size / (1024 * 1024)),
    mobile_number: mobile_number,
    body: {
      detectedActions: parsedActions,
      livenessCheck: result.livenessPass,
      matchedSequence: parsedActions,
      image: result.capturedImage
    }
  });
});
export const confirmSelfieStep = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.customer?.id;
  if (!userId) throw new UnauthorizedError("Unauthorized context.");

  const result = await selfieService.completeSelfieStep(userId);

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("reg_step", result.currentStep, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });

  ApiResponse.ok(res, result, "Registration step advanced to selfie_verified.");
});