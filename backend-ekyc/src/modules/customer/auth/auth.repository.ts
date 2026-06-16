import pool from "../../../config/db.js";

export class AuthRepository {
  // Find user by mobile number
  async findUserByMobile(mobile: string) {
    const query = "SELECT * FROM users WHERE mobile = $1";
    const result = await pool.query(query, [mobile]);
    return result.rows[0] || null;
  }

  // Create a user placeholder profile on first OTP dispatch
  async createUserPlaceholder(mobile: string) {
    const query =
      "INSERT INTO users (mobile) VALUES ($1) ON CONFLICT (mobile) DO NOTHING RETURNING *";
    const result = await pool.query(query, [mobile]);
    return result.rows[0];
  }

  // Set all existing unverified OTP rows to true to clean up stale rows
  async invalidatePriorOTPs(mobile: string) {
    const query =
      "UPDATE otp_verification SET verified = true WHERE mobile = $1 AND verified = false";
    await pool.query(query, [mobile]);
  }

  // Store a fresh OTP token lifecycle
  async saveOTPRecord(
    mobile: string,
    email: string,
    otpCode: string,
    expiresAt: Date,
  ) {
    const query = `
      INSERT INTO otp_verification (mobile, email, otp_code, expires_at) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *;
    `;

    const values = [mobile, email, otpCode, expiresAt];

    // 🌟 FIXED: Changed from "this.db.query" to "pool.query"
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get the most recent active OTP payload
  async getLatestUnverifiedOTP(mobile: string) {
    const query = `
      SELECT * FROM otp_verification 
      WHERE mobile = $1 AND verified = false 
      ORDER BY created_at DESC LIMIT 1`;
    const result = await pool.query(query, [mobile]);
    return result.rows[0] || null;
  }

  // Increment failure safety counter
  async incrementOTPEffortCounter(id: string) {
    const query =
      "UPDATE otp_verification SET attempts = attempts + 1 WHERE id = $1";
    await pool.query(query, [id]);
  }

  // Atomically finalize verification status on both tables
  async finalizeUserVerification(otpId: string, mobile: string) {
    // 1. Mark OTP used
    await pool.query(
      "UPDATE otp_verification SET verified = true WHERE id = $1",
      [otpId],
    );
    // 2. Activate user verification flag
    const query = `
      UPDATE users SET is_verified = true, updated_at = NOW() 
      WHERE mobile = $1 RETURNING id, mobile, is_verified`;
    const result = await pool.query(query, [mobile]);
    return result.rows[0];
  }

  // Save JWT token into user_sessions table
  async createUserSession(userId: string, tokenHash: string) {
    const query = `
    INSERT INTO user_sessions (user_id, token_hash, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '7 days')
    RETURNING *;
  `;
    const result = await pool.query(query, [userId, tokenHash]);
    return result.rows[0];
  }
}
