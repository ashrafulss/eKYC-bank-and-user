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
    const OTP_LIFETIME_SECONDS = 180;
    const displayMessageEN = `Verification code sent successfully via ${method.toUpperCase()}`;

    return ApiResponse.ok(
      res,
      {
        otpExpirySecond: OTP_LIFETIME_SECONDS,
        displayMessageEN
      },
      displayMessageEN,
    );

  } catch (error) {
    throw mapServiceError(error);
  }

});


export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { mobile, otpCode } = req.body;

  if (!mobile || !otpCode) {
    throw new BadRequestError("Mobile number and code are required");
  }

  const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip;
  const userAgent = req.headers["user-agent"] || "Unknown Browser";

  let result;
  try {
    result = await authService.validateOTPVerification(mobile, otpCode, ipAddress, userAgent);
  } catch (error) {
    throw mapServiceError(error);
  }

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("next_auth_session", result.accessToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 30 * 60 * 1000, // 30 minutes
    path: "/",
  });

  // 2. Registration Step Cookie
  res.cookie("reg_step", result.user.current_step, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.cookie("next_refresh_token", result.refreshToken, {
    httpOnly: true, 
    secure: isProduction,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, 
    path: "/",
  });

  ApiResponse.ok(
    res,
    { user: result.user }, // Cleaned payload
    "Mobile number verified successfully",
  );
});


export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const tokenPayload = req.body.refreshToken || req.cookies?.next_refresh_token;

    if (!tokenPayload) {
      throw new BadRequestError("Refresh token session context is missing");
    }

    let result;
    try {
      result = await authService.refreshUserToken(tokenPayload);
    } catch (error) {
      throw mapServiceError(error);
    }

    const isProduction = process.env.NODE_ENV === "production";
    
if (result && result.accessToken) {
  res.cookie("next_auth_session", result.accessToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 30 * 60 * 1000, 
    path: "/",
  });

 
  if (result.refreshToken) {
    res.cookie("next_refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });
  }
}

    ApiResponse.ok(res, result, "Token refreshed successfully");
  },
);



// 🌟 UPDATED: Complete cookie eviction on sign-out
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const tokenPayload = req.body.refreshToken || req.cookies["next_refresh_token"];

  if (tokenPayload) {
    await authService.logoutCustomer(tokenPayload);
  }

  // Clear all non-HttpOnly and HttpOnly cookies linked to the authentication process
  res.clearCookie("reg_step", { path: "/", sameSite: "strict" });
  res.clearCookie("next_auth_session", { path: "/", sameSite: "strict" });
  res.clearCookie("next_refresh_token", { path: "/", sameSite: "strict" });

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

