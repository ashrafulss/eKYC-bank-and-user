import type { PoolClient } from "pg";

export interface BOPreferencesDBInput {
  accountType: string;
  depositoryParticipant: string;
  bankName: string;
  settlementAccount: string;
  tinNumber: string;
  permissionCash: boolean;
  permissionMargin: boolean;
  permissionForeign: boolean;
}

export const boRepository = {
  /**
   * Helper to retrieve the active application identity associated with the customer session
   */
  async getApplicationId(userId: string, client: PoolClient): Promise<string> {
    const result = await client.query(
      `SELECT id FROM public.applications WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    if (result.rows.length === 0) {
      throw new Error("APPLICATION_NOT_FOUND");
    }
    return result.rows[0].id;
  },

  /**
   * 🌟 Clean production upsert targeting public.bo_accounts structural table layout
   */
  async updateApplicationPreferences(
    userId: string,
    prefs: BOPreferencesDBInput,
    client: PoolClient
  ) {
    // 1. Resolve application reference key
    const applicationId = await this.getApplicationId(userId, client);

    // 2. Perform an atomic upsert on public.bo_accounts using application_id constraints
    const result = await client.query(
      `INSERT INTO public.bo_accounts (
        application_id, 
        account_type, 
        depository_participant, 
        bank_name, 
        settlement_account, 
        tin_number, 
        permission_cash, 
        permission_margin, 
        permission_foreign, 
        updated_at
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (application_id) 
       DO UPDATE SET 
         account_type = EXCLUDED.account_type,
         depository_participant = EXCLUDED.depository_participant,
         bank_name = EXCLUDED.bank_name,
         settlement_account = EXCLUDED.settlement_account,
         tin_number = EXCLUDED.tin_number,
         permission_cash = EXCLUDED.permission_cash,
         permission_margin = EXCLUDED.permission_margin,
         permission_foreign = EXCLUDED.permission_foreign,
         updated_at = NOW()
       RETURNING id`,
      [
        applicationId,
        prefs.accountType,
        prefs.depositoryParticipant,
        prefs.bankName,
        prefs.settlementAccount,
        prefs.tinNumber,
        prefs.permissionCash,
        prefs.permissionMargin,
        prefs.permissionForeign
      ]
    );

    return result.rows[0];
  },

  /**
   * Updates onboarding progression state tracker
   */
  async advanceStepToBoDone(userId: string, client: PoolClient) {
    await client.query(
      `UPDATE public.users 
       SET current_step = 'bo_details_done'::public.registration_step, updated_at = NOW() 
       WHERE id = $1`,
      [userId]
    );
  }
};