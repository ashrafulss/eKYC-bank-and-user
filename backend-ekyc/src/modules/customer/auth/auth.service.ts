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
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const hashedOtpCode = crypto
      .createHash("sha256")
      .update(rawOtpCode)
      .digest("hex");

    await this.authRepository.saveOTPRecord(
      mobile,
      email || "no-email@ekyc.local",
      hashedOtpCode,
      expiresAt,
    );
    await this.authRepository.createUserPlaceholder(mobile);
    if (deliveryMethod === "email" || deliveryMethod === "both") {
      try {
        const mailOptions = {
          from: `"eKYC Verification Portal" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Your eKYC Account Verification Code",
          html: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
            <h2>eKYC Identity Verification</h2>
            <p>Your secure verification code is: <strong>${rawOtpCode}</strong></p>
          </div>
        `,
        };
        await this.transporter.sendMail(mailOptions);
        console.log(`[SMTP Dual Mode] Verification email sent to: ${email}`);
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

  async validateOTPVerification(mobile: string, otpCode: string) {
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

    const user = await this.authRepository.finalizeUserVerification(
      record.id,
      mobile,
    );

    const accessToken = signAccessToken({ id: user.id, type: "customer" });
    const refreshToken = signRefreshToken({ id: user.id, type: "customer" });

    await this.authRepository.createUserSession(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  }

  async refreshUserToken(refreshToken: string) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    const session = await this.authRepository.findValidSession(refreshToken);
    if (!session) {
      await this.authRepository.deleteAllUserSessions(decoded.id);
      throw new Error("SESSION_REVOKED");
    }
    await this.authRepository.deleteSession(refreshToken);

    const newAccessToken = signAccessToken({
      id: decoded.id,
      type: "customer",
    });
    const newRefreshToken = signRefreshToken({
      id: decoded.id,
      type: "customer",
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

    // Map database columns to the frontend expected User format
    return {
      id: row.id,
      mobile: row.mobile,
      name: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : "",
      email: row.email || "",
      nid: "", 
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
    };
  }
}
