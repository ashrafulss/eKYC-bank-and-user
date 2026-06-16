import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { mapServiceError } from "../../../utils/errorMap.js";
import { BadRequestError } from "../../../utils/AppError.js";
import { validateOtpRequest } from "../../../utils/validate.js";

const authService = new AuthService();

export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { mobile, email, deliveryMethod } = req.body;

  const method = validateOtpRequest(mobile, email, deliveryMethod);

  try {
    await authService.processOTPDelivery(mobile, email, method);
  } catch (error) {
    throw mapServiceError(error);
  }

  ApiResponse.ok(
    res,
    undefined,
    `Verification code dispatched successfully via ${method.toUpperCase()}`,
  );
});

export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { mobile, otpCode } = req.body;

  if (!mobile || !otpCode) {
    throw new BadRequestError("Mobile number and code are required");
  }

  let result;
  try {
    result = await authService.validateOTPVerification(mobile, otpCode);
  } catch (error) {
    throw mapServiceError(error);
  }

  ApiResponse.ok(
    res,
    { user: result.user, token: result.token },
    "Mobile number verified successfully",
  );
});
