import pool from "../../../config/db.js";
import { withTransaction } from "../../../utils/withTransaction.js";

export class AuthRepository {

  async findUserByMobile(mobile: string) {
    const query = "SELECT * FROM users WHERE mobile = $1";
    const result = await pool.query(query, [mobile]);
    return result.rows[0] || null;
  }

 
  async createUserPlaceholder(mobile: string) {
    const query =
      "INSERT INTO users (mobile) VALUES ($1) ON CONFLICT (mobile) DO NOTHING RETURNING *";
    const result = await pool.query(query, [mobile]);
    return result.rows[0];
  }

  
  async invalidatePriorOTPs(mobile: string) {
    const query =
      "UPDATE otp_verification SET verified = true WHERE mobile = $1 AND verified = false";
    await pool.query(query, [mobile]);
  }

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

    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  async getLatestUnverifiedOTP(mobile: string) {
    const query = `
      SELECT * FROM otp_verification 
      WHERE mobile = $1 AND verified = false 
      ORDER BY created_at DESC LIMIT 1`;
    const result = await pool.query(query, [mobile]);
    return result.rows[0] || null;
  }
  

  
  async incrementOTPEffortCounter(id: string) {
    const query =
      "UPDATE otp_verification SET attempts = attempts + 1 WHERE id = $1";
    await pool.query(query, [id]);
  }

  
async finalizeVerificationStepAndSession(
    otpId: string,
    mobile: string,
    userId: string,
    step: string,
    refreshToken: string,
  ): Promise<{ id: string; mobile: string; is_verified: boolean; current_step: string }> {
    return withTransaction(async (client) => {
      // 1. Mark OTP as used
      await client.query(
        "UPDATE otp_verification SET verified = true WHERE id = $1",
        [otpId],
      );

      // 2. Activate user's is_verified flag
      const userResult = await client.query(
        `UPDATE users SET is_verified = true, updated_at = NOW()
         WHERE mobile = $1 RETURNING id, mobile, is_verified`,
        [mobile],
      );

      const verifiedUser = userResult.rows[0];
      if (!verifiedUser) {
        throw new Error("USER_NOT_FOUND");
      }

      // 3. Advance the registration step
      const stepResult = await client.query(
        `UPDATE users
         SET current_step = $2::public.registration_step, updated_at = NOW()
         WHERE id = $1
         RETURNING id, mobile, is_verified, current_step`,
        [userId, step],
      );

      const updatedUser = stepResult.rows[0];

      // 4. Create the session
      await client.query(
        `INSERT INTO user_sessions (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
        [updatedUser.id, refreshToken],
      );

      return updatedUser;
    });
  }

 
  async createUserSession(userId: string, refreshToken: string) {
    const query = `
    INSERT INTO user_sessions (user_id, token_hash, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '24 hours')
    RETURNING *;
  `;
    const result = await pool.query(query, [userId, refreshToken]);
    return result.rows[0];
  }

  
  async findValidSession(refreshToken: string) {
    const query = `
    SELECT * FROM user_sessions
    WHERE token_hash = $1 AND expires_at > NOW()
  `;
    const result = await pool.query(query, [refreshToken]);
    return result.rows[0] || null;
  }


  async deleteSession(refreshToken: string) {
    await pool.query("DELETE FROM user_sessions WHERE token_hash = $1", [
      refreshToken,
    ]);
  }


  async deleteAllUserSessions(userId: string) {
    await pool.query("DELETE FROM user_sessions WHERE user_id = $1", [userId]);
  }

  async findFullUserById(id: string) {
    const query = `
      SELECT 
        u.id,
        u.mobile,
        u.email,
        u.is_verified,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        addr.division,
        addr.district,
        bo.account_type,
        bo.tin_number,
        bo.permission_cash,
        bo.permission_margin,
        bo.permission_foreign,
        app.status as app_status,
        app.submitted_at
      FROM users u
      LEFT JOIN applications app ON app.user_id = u.id
      LEFT JOIN personal_info p ON p.application_id = app.id
      LEFT JOIN address_info addr ON addr.application_id = app.id
      LEFT JOIN bo_accounts bo ON bo.application_id = app.id
      WHERE u.id = $1
      ORDER BY app.submitted_at DESC
      LIMIT 1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }


  async updateUserRegistrationStep(userId: string, step: string) {
    const query = `
      UPDATE users 
      SET current_step = $2::public.registration_step, 
      updated_at = NOW() 
      WHERE id = $1 
      RETURNING id, current_step;
    `;
    const result = await pool.query(query, [userId, step]);
    return result.rows[0];
  }

  async getUserByMobile(mobile: string) {
  const query = `
    SELECT id, mobile, email, current_step 
    FROM users 
    WHERE mobile = $1 
    LIMIT 1;
  `;
  const result = await pool.query(query, [mobile]);
  return result.rows[0]; // Returns the row containing 'id' or undefined if not found
}

}
