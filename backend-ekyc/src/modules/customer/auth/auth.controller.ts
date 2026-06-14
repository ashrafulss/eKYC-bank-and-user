import { type Request, type Response } from "express";
import { AuthService } from "./auth.service.js";

const authService = new AuthService();

export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  // Extract inputs along with the channel selector
  const { mobile, email, deliveryMethod } = req.body;

  // 🌟 Allow 'sms', 'email', or 'both'
  const validMethods = ["sms", "email", "both"];
  if (!deliveryMethod || !validMethods.includes(deliveryMethod)) {
    res.status(400).json({
      success: false,
      message: "Invalid delivery method. Select 'sms', 'email', or 'both'.",
    });
    return;
  }

  // Cross-verify missing parameter conditions based on selection
  if ((deliveryMethod === "sms" || deliveryMethod === "both") && !mobile) {
    res
      .status(400)
      .json({
        success: false,
        message: "Mobile number is required for this delivery method",
      });
    return;
  }
  if ((deliveryMethod === "email" || deliveryMethod === "both") && !email) {
    res
      .status(400)
      .json({
        success: false,
        message: "Email address is required for this delivery method",
      });
    return;
  }

  try {
    const generatedCode = await authService.processOTPDelivery(
      mobile,
      email,
      deliveryMethod,
    );

    res.status(200).json({
      success: true,
      message: `Verification code dispatched successfully via ${deliveryMethod.toUpperCase()}`,
    });
  } catch (error: any) {
    console.error("Error handling sendOTP controller step:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  const { mobile, otpCode } = req.body;
  if (!mobile || !otpCode) {
    res
      .status(400)
      .json({ success: false, message: "Mobile number and code are required" });
    return;
  }

  try {
    const verifiedUser = await authService.validateOTPVerification(
      mobile,
      otpCode,
    );
    res.status(200).json({
      success: true,
      message: "Mobile number verified successfully",
      user: verifiedUser,
    });
  } catch (error: any) {
    if (error.message === "NO_RECORD") {
      res.status(404).json({
        success: false,
        message: "No active verification request found",
      });
      return;
    }
    if (error.message === "ATTEMPTS_EXCEEDED") {
      res.status(400).json({
        success: false,
        message: "Maximum attempts exceeded. Request a new code.",
      });
      return;
    }
    if (error.message === "EXPIRED") {
      res
        .status(400)
        .json({ success: false, message: "Verification code has expired" });
      return;
    }
    if (error.message === "INVALID_CODE") {
      res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });
      return;
    }

    console.error(
      "System error handling verifyOTP controller step:",
      error.message,
    );
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
