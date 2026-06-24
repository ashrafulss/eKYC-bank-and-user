import crypto from "crypto";
import nodemailer from "nodemailer";
import { AuthRepository } from "./auth.repository.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../../utils/jwt.js";

export class AuthService {
  private authRepository = new AuthRepository();

  private transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  async processOTPDelivery(
    mobile: string,
    email: string,
    deliveryMethod: "sms" | "email" | "both",
  ): Promise<string> {
    await this.authRepository.invalidatePriorOTPs(mobile);
    const rawOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);
    const hashedOtpCode = crypto
      .createHash("sha256")
      .update(rawOtpCode)
      .digest("hex");

      const finalEmail = email ?? "ssajeebs@gmail.com"

    await this.authRepository.saveOTPRecord(
      mobile,
      finalEmail,
      hashedOtpCode,
      expiresAt,
    );
    await this.authRepository.createUserPlaceholder(mobile);
    if (deliveryMethod === "email" || deliveryMethod === "both") {
      try {
        const mailOptions = {
          from: `"eKYC Verification Portal" <${process.env.EMAIL_USER}>`,
          to: finalEmail,
          subject: "Your eKYC Account Verification Code",
html: `
          <div style="background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 12px;">
            <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
              
              <div style="margin-bottom: 24px; text-align: left;">
                <span style="font-size: 20px; font-weight: 700; color: #0f172a; tracking-letter: -0.5px;">
                  <span style="color: #2563eb;">eKYC</span> Identity
                </span>
              </div>
              
              <hr style="border: 0; border-top: 1px solid #edf2f7; margin-bottom: 24px;" />

              <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin-top: 0; margin-bottom: 12px;">
                Verify your identity
              </h2>
              
              <p style="font-size: 15px; line-height: 24px; color: #475569; margin-bottom: 28px;">
                To secure your account setup, please use the following one-time verification code (OTP). This code is valid for <strong>3 minutes</strong>.
              </p>

              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 28px; border: 1px dashed #cbd5e1;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1e3a8a; display: inline-block; padding-left: 6px;">
                  ${rawOtpCode}
                </span>
              </div>

              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="font-size: 13px; line-height: 20px; color: #78350f; margin: 0;">
                  <strong>Security Reminder:</strong> Never share this code with anyone. eKYC support staff will never ask for your verification code.
                </p>
              </div>

              <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
                If you did not request this code, you can safely ignore this email.
              </p>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                © ${new Date().getFullYear()} eKYC Verification Portal. All rights reserved.
              </p>
            </div>
          </div>
        `,
        };
        await this.transporter.sendMail(mailOptions);
        console.log(`[SMTP Dual Mode] Verification email sent to: ${finalEmail}`);
      } catch (emailError) {
        console.error(
          "SMTP channel error during dual transmission:",
          emailError,
        );
      }
    }

    if (deliveryMethod === "sms" || deliveryMethod === "both") {
      console.log(
        `[SMS MOCK Dual Mode] Dispatch to ${mobile} -> Code: ${rawOtpCode}`,
      );
    }

    return rawOtpCode;
  }


async validateOTPVerification(mobile: string, otpCode: string, ipAddress?: string, userAgent?: string) {

  const record = await this.authRepository.getLatestUnverifiedOTP(mobile);

  if (!record) throw new Error("NO_RECORD");
  if (record.attempts >= 3) throw new Error("ATTEMPTS_EXCEEDED");
  if (new Date() > new Date(record.expires_at)) throw new Error("EXPIRED");

  const hashedInput = crypto
    .createHash("sha256")
    .update(otpCode)
    .digest("hex");

  if (record.otp_code !== hashedInput) {
    await this.authRepository.incrementOTPEffortCounter(record.id);
    throw new Error("INVALID_CODE");
  }

  const existingUser = await this.authRepository.getUserByMobile(mobile);

  if (!existingUser) {
    throw new Error("USER_NOT_FOUND");
  }

let stepToAssign = "phone_number_verified";
  
  const unverifiedStates = ["mobile_not_verified", "phone_number_not_verified"];

  if (
    existingUser.current_step && 
    !unverifiedStates.includes(existingUser.current_step)
  ) {
    stepToAssign = existingUser.current_step;
  }
  const accessToken = signAccessToken({
    id: existingUser.id,
    type: "customer",
    current_step: stepToAssign,
     mobile: mobile, 
  });
  const refreshToken = signRefreshToken({
    id: existingUser.id,
    type: "customer",
    current_step: stepToAssign, 
     mobile: mobile, 
  });

  const user = await this.authRepository.finalizeVerificationStepAndSession(
    record.id,
    mobile,
    existingUser.id,
    stepToAssign,
    refreshToken,
    ipAddress,
    userAgent,
  );

  return { user, accessToken, refreshToken };
}


async refreshUserToken(refreshToken: string) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  let session = await this.authRepository.findValidSession(refreshToken);
  
  if (!session) {
    const userProfile = await this.authRepository.findFullUserById(decoded.id);
    if (!userProfile) {
      throw new Error("SESSION_REVOKED");
    }
    
    const currentStep = userProfile.current_step || decoded.current_step || "phone_number_verified";
    
    const fallbackAccessToken = signAccessToken({
      id: decoded.id,
      type: "customer",
      current_step: currentStep, 
      mobile: decoded.mobile, 
    });

    return { accessToken: fallbackAccessToken, refreshToken: null };
  }

  await this.authRepository.deleteSession(refreshToken);

  const userProfile = await this.authRepository.findFullUserById(decoded.id);
  const currentStep = userProfile?.current_step || decoded.current_step || "phone_number_verified";


  const newAccessToken = signAccessToken({
    id: decoded.id,
    type: "customer",
    current_step: currentStep, 
    mobile: decoded.mobile, 
  });

  const newRefreshToken = signRefreshToken({
    id: decoded.id,
    type: "customer",
    current_step: currentStep, 
    mobile: decoded.mobile, 
  });

  await this.authRepository.createUserSession(decoded.id, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

  async logoutCustomer(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    await this.authRepository.deleteSession(refreshToken);
  }

  async getUserProfile(id: string) {
    const row = await this.authRepository.findFullUserById(id);
    if (!row) return null;

    return {
      id: row.id,
      mobile: row.mobile,
      name: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : "",
      email: row.email || "",
      nid: "", 
      nidFront: row.nid_front || null,
      nidBack: row.nid_back || null,
      dob: row.date_of_birth ? row.date_of_birth.toISOString().split('T')[0] : "",
      division: row.division || "",
      district: row.district || "",
      accountType: row.account_type || "",
      tin: row.tin_number || "",
      tradingPermissions: [
        ...(row.permission_cash ? ["Cash"] : []),
        ...(row.permission_margin ? ["Margin"] : []),
        ...(row.permission_foreign ? ["Foreign"] : [])
      ],
      kycStatus: row.app_status === "approved" ? "verified" : "pending",
      boAccountNo: "", 
      verifiedAt: row.submitted_at ? row.submitted_at.toISOString() : "",
      avatar: null,
      current_step: row.current_step,
    };
  }
}
