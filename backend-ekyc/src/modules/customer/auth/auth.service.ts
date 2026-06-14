import nodemailer from "nodemailer";
import { AuthRepository } from "./auth.repository.js";

export class AuthService {
  private authRepository = new AuthRepository();

  // Create your Nodemailer email transporter instance
  private transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  // 1. Handles generating, saving, and delivering the OTP
  async processOTPDelivery(
    mobile: string,
    email: string,
    deliveryMethod: "sms" | "email" | "both",
  ): Promise<string> {
    // 1. Invalidate old records
    await this.authRepository.invalidatePriorOTPs(mobile);

    // 2. Generate a SINGLE code for both destinations
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 3. Save to database
    await this.authRepository.saveOTPRecord(
      mobile,
      email || "no-email@ekyc.local",
      otpCode,
      expiresAt,
    );
    await this.authRepository.createUserPlaceholder(mobile);

    // 4. 🌟 Execute Email Delivery (Fires for 'email' or 'both')
    if (deliveryMethod === "email" || deliveryMethod === "both") {
      try {
        const mailOptions = {
          from: `"eKYC Verification Portal" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Your eKYC Account Verification Code",
          html: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
            <h2>eKYC Identity Verification</h2>
            <p>Your secure verification code is: <strong>${otpCode}</strong></p>
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

    // 5. 🌟 Execute SMS Delivery (Fires for 'sms' or 'both')
    if (deliveryMethod === "sms" || deliveryMethod === "both") {
      // Prints to terminal until you plug in a live local network gateway API key
      console.log(
        `[SMS MOCK Dual Mode] Dispatch to ${mobile} -> Code: ${otpCode}`,
      );
    }

    return otpCode;
  }

  // 2. 🌟 ADD/RESTORE THIS METHOD TO FIX YOUR ERROR
  async validateOTPVerification(mobile: string, otpCode: string) {
    // Fetch the latest unverified token profile from the database
    const record = await this.authRepository.getLatestUnverifiedOTP(mobile);

    if (!record) {
      throw new Error("NO_RECORD");
    }

    // Safety Check: Limit verification attempts to 3 to prevent brute-force attacks
    if (record.attempts >= 3) {
      throw new Error("ATTEMPTS_EXCEEDED");
    }

    // Expiration Check: Ensure token is used within the 5-minute window
    if (new Date() > new Date(record.expires_at)) {
      throw new Error("EXPIRED");
    }

    // Code Match Validation
    if (record.otp_code !== otpCode) {
      // Increment failure safety counter in the database
      await this.authRepository.incrementOTPEffortCounter(record.id);
      throw new Error("INVALID_CODE");
    }

    // Success: Finalize statuses across both tables atomically
    return await this.authRepository.finalizeUserVerification(
      record.id,
      mobile,
    );
  }
}
