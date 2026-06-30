
import type { PoolClient } from "pg";
import type { UpdatePersonalInfoInput } from "../basic-info/basic-info.repository.js";

export const reviewRepository = {

  async getFullApplicationSummary(userId: string, client: PoolClient) {
    const query = await client.query(
      `SELECT 
        app.id as application_id,
        app.status as application_status,
        
        personal.first_name,
        personal.last_name,
        personal.full_name_bangla,
        personal.father_name_bangla,
        personal.mother_name_bangla,
        personal.spouse_name,
        personal.blood_group,
        personal.birth_place,
        personal.nid_number,
        personal.date_of_birth,
        personal.gender,
        personal.mobile,
        personal.email,
        personal.occupation,
        personal.employer_name,
        personal.monthly_income,
        
        addr.address_line1,
        addr.address_line2,
        addr.area,
        addr.district,
        addr.division,
        addr.postal_code,

        doc.ocr_data
        
       FROM public.applications app
       LEFT JOIN public.personal_info personal ON personal.application_id = app.id
       LEFT JOIN public.address_info addr ON addr.application_id = app.id
       LEFT JOIN public.user_documents doc ON doc.application_id = app.id 
         AND doc.doc_type = 'nid_front' 
         AND doc.is_latest = true
       WHERE app.user_id = $1 
       LIMIT 1`,
      [userId]
    );

    if (query.rows.length === 0) return null;
    const row = query.rows[0];

    const nomineesQuery = await client.query(
      `SELECT name, relationship, nid_passport, date_of_birth, share_percent, contact, nid_skipped
       FROM public.nominees
       WHERE application_id = $1
       ORDER BY created_at ASC`,
      [row.application_id]
    );

    const boAccountsQuery = await client.query(
      `SELECT account_type, depository_participant, bank_name, settlement_account, tin_number,
              permission_cash, permission_margin, permission_foreign
       FROM public.bo_accounts
       WHERE application_id = $1
       LIMIT 1`,
      [row.application_id]
    );

    return {
      application: row,
      nominees: nomineesQuery.rows,
      boAccount: boAccountsQuery.rows[0] || null
    };
  },

  // Resolve applicationId from userId
  async getApplicationIdByUserId(userId: string, client: PoolClient): Promise<string | null> {
    const result = await client.query(
      `SELECT id FROM public.applications WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    return result.rows[0]?.id ?? null;
  },

  // Check current_step on users table — guard against double submission
  async getUserCurrentStep(userId: string, client: PoolClient): Promise<string | null> {
    const result = await client.query(
      `SELECT current_step FROM public.users WHERE id = $1`,
      [userId]
    );
    return result.rows[0]?.current_step ?? null;
  },

  // 1. Mark application as pending (visible to bank admin maker/checker)
  // 2. Update submitted_at to actual submission time
  async markApplicationSubmitted(applicationId: string, client: PoolClient): Promise<void> {
    await client.query(
      `UPDATE public.applications
       SET status = 'pending',
           submitted_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [applicationId]
    );
  },

  // Advance user wizard step to 'submitted' — final step in registration_step ENUM
  async advanceUserStepToSubmitted(userId: string, client: PoolClient): Promise<void> {
    await client.query(
      `UPDATE public.users
       SET current_step = 'submitted',
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
  },


    async updatePersonalInfo(input: UpdatePersonalInfoInput, client: PoolClient): Promise<void> {
      // 1. Update personal data fields
      await client.query(
    `UPDATE public.personal_info 
     SET 
       first_name         = $1,
       full_name_bangla   = $2,
       father_name_bangla = $3,
       mother_name_bangla = $4,
       nid_number         = $5,
       email              = $6,
       occupation         = $7,
       employer_name      = $8,
       monthly_income     = $9,
       updated_at         = NOW() 
     WHERE application_id = $10`,
    [
      input.fullNameEnglish,   // $1  → first_name (full english name)
      input.fullNameBangla,    // $2
      input.fatherNameBangla,  // $3
      input.motherNameBangla,  // $4
      input.nidNumber,         // $5
      input.email,             // $6
      input.occupation,        // $7
      input.employerName,      // $8
      input.monthlyIncome,     // $9
      input.applicationId,     // $10
    ]
  );
  
      // 2. 🌟 FIXED: Upserts the customized address directly to the address_line1 column
      await client.query(
    `INSERT INTO public.address_info (
      application_id, 
      address_line1, 
      district, 
      division, 
      updated_at
     )
     VALUES ($1, $2, 'Unknown', 'Unknown', NOW())
     ON CONFLICT (application_id)
     DO UPDATE SET 
       address_line1 = EXCLUDED.address_line1, 
       updated_at = NOW();`,
    [input.applicationId, input.presentAddress]
  );;
    },
};