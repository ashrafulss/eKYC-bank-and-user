// review.controller.ts
import type { Request, Response } from "express";
import { reviewService } from "./review.service.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { BadRequestError } from "../../../utils/AppError.js";

export const getApplicationReviewSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.customer?.id;
  if (!userId) {
    throw new BadRequestError("Customer ID not found in request.");
  }

  const data = await reviewService.getApplicationSummary(userId);

  if (!data) {
    throw new BadRequestError("No active identity application registration records found.");
  }

  ApiResponse.ok(res, data, "Review configuration summary payload aggregated successfully.");
});