import crypto from "crypto"; // 🌟 CRITICAL: Add this native Node.js import at the top
import nodemailer from "nodemailer";
import { AuthRepository } from "./auth.repository.js";
import { signUserToken } from "../../../utils/jwt.js";

export class AuthService {
  private authRepository = new AuthRepository();

  // Your existing Nodemailer transporter configuration remains here...
  private transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  // 1. Handles generating, hashing, saving, and delivering the OTP
  async processOTPDelivery(
    mobile: string,
    email: string,
    deliveryMethod: "sms" | "email" | "both",
  ): Promise<string> {
    // 1. Invalidate old records
    await this.authRepository.invalidatePriorOTPs(mobile);

    // 2. Generate a SINGLE RAW code for the user
    const rawOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 3. 🌟 SECURITY FIX: Hash the raw code using SHA-256 before it touches Postgres
    const hashedOtpCode = crypto
      .createHash("sha256")
      .update(rawOtpCode)
      .digest("hex");

    // 4. Save the HASHED code to the database instead of the plaintext one
    await this.authRepository.saveOTPRecord(
      mobile,
      email || "no-email@ekyc.local",
      hashedOtpCode, // 🌟 Passing the secure hash string here
      expiresAt,
    );
    await this.authRepository.createUserPlaceholder(mobile);

    // 5. Execute Email Delivery using the RAW visible code digits
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

    // 6. Execute SMS Delivery using the RAW visible code digits
    if (deliveryMethod === "sms" || deliveryMethod === "both") {
      console.log(
        `[SMS MOCK Dual Mode] Dispatch to ${mobile} -> Code: ${rawOtpCode}`,
      );
    }

    return rawOtpCode; // Returns plaintext to controller if it prints inside terminal logs
  }

  async validateOTPVerification(mobile: string, otpCode: string) {
    const record = await this.authRepository.getLatestUnverifiedOTP(mobile);

    if (!record) {
      throw new Error("NO_RECORD");
    }

    if (record.attempts >= 3) {
      throw new Error("ATTEMPTS_EXCEEDED");
    }

    if (new Date() > new Date(record.expires_at)) {
      throw new Error("EXPIRED");
    }

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

    // 🌟 Generate JWT token
    const token = signUserToken({ id: user.id, type: "user" });

    // 🌟 Save session in DB
    await this.authRepository.createUserSession(user.id, token);

    return { user, token };
  }
}
