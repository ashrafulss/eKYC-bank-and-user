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
    {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    "Mobile number verified successfully",
  );
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new BadRequestError("Refresh token is required");
    }

    let result;
    try {
      result = await authService.refreshUserToken(refreshToken);
    } catch (error) {
      throw mapServiceError(error);
    }

    ApiResponse.ok(res, result, "Token refreshed successfully");
  },
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  await authService.logoutCustomer(refreshToken);

  res.clearCookie("reg_step", { httpOnly: true, sameSite: "strict" });
  res.clearCookie("next_auth_session", { httpOnly: true, sameSite: "strict" });

  ApiResponse.ok(res, undefined, "Logged out successfully");
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.customer?.id;
  if (!customerId) {
    throw new BadRequestError("Customer not authenticated");
  }

  const profile = await authService.getUserProfile(customerId);
  if (!profile) {
    throw new BadRequestError("Customer profile not found");
  }

  ApiResponse.ok(res, { user: profile }, "Profile retrieved successfully");
});

