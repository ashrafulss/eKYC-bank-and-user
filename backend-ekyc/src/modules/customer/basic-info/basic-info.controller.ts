import type { Request, Response } from "express";
import { basicInfoService } from "./basic-info.service.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { BadRequestError, UnauthorizedError } from "../../../utils/AppError.js";

export const getBasicInfoProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.customer?.id; 
  
  if (!userId) {
    throw new UnauthorizedError("Unauthorized profile context session missing.");
  }

  const profileData = await basicInfoService.getPrepopulatedProfile(userId);

  if (!profileData) {
    throw new BadRequestError("No verified identity application configuration found for this session.");
  }

  ApiResponse.ok(
    res,
    profileData,
    "Primary information profile records read directly from relational tables successfully."
  );
});

export const saveBasicInfoProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.customer?.id; 
  if (!userId) {
    throw new UnauthorizedError("Unauthorized profile context session missing.");
  }

  await basicInfoService.saveBasicProfile(userId, req.body);

  ApiResponse.ok(
    res,
    null,
    "Basic user registration additions preserved and step advanced successfully."
  );
});