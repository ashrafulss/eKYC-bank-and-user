import type { Request, Response } from "express";
import { nomineeService } from "./nominee.service.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { BadRequestError, UnauthorizedError } from "../../../utils/AppError.js";
import { validateBase64Image } from "../../../utils/imageValidator.js";

export const saveNominees = asyncHandler(async (req: Request, res: Response) => {
  const { nominees } = req.body;

  if (!nominees || !Array.isArray(nominees) || nominees.length === 0) {
    throw new BadRequestError("At least one nominee record setup details are required.");
  }

  const userId = req.customer?.id; 
  if (!userId) {
    throw new UnauthorizedError("Unauthorized profile request session context missing.");
  }

  const result = await nomineeService.processNomineeRecords(userId, nominees);

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
      nomineesProcessedCount: result.count,
    },
    "Nominee structural records updated and saved successfully."
  );
});


export const verifyNomineeNIDCard = asyncHandler(async (req: Request, res: Response) => {

  const { frontImage, backImage } = req.body;
  const userId = req.customer?.id;

  if (!frontImage || !backImage) {
    throw new BadRequestError("Both Front and Back identity card images are required.");
  }
  if (!userId) {
    throw new UnauthorizedError("Unauthorized session request context missing.");
  }

  validateBase64Image(frontImage, "Front NID Image");
  validateBase64Image(backImage, "Back NID Image");

  const savedRecord = await nomineeService.processOcrAndSaveInitial(userId, frontImage, backImage);

  ApiResponse.ok(
    res,
    savedRecord,
    "Nominee parsed via static ML engine and securely stored in database tables."
  );
});