import type { PoolClient } from "pg";
import type { UpdatePersonalInfoInput } from "../basic-info/basic-info.repository.js";

export interface NomineeInput {
  name: string;
  relationship: string;
  nid: string;
  dob: string;
  share: string;
  contact: string;
}

export interface BoAccountInput {
  accountType: string;
  dp: string;
  bank: string;
  settlementAccount: string;
  tin: string;
  cash: boolean;
  margin: boolean;
  foreign: boolean;
}

const parseSharePercent = (share: string): number | null => {
  if (!share) return null;
  const cleaned = share.replace("%", "").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

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

  async getApplicationIdByUserId(userId: string, client: PoolClient): Promise<string | null> {
    const result = await client.query(
      `SELECT id FROM public.applications WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    return result.rows[0]?.id ?? null;
  },

  async getUserCurrentStep(userId: string, client: PoolClient): Promise<string | null> {
    const result = await client.query(
      `SELECT current_step FROM public.users WHERE id = $1`,
      [userId]
    );
    return result.rows[0]?.current_step ?? null;
  },

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
  await client.query(
    `UPDATE public.personal_info 
     SET 
       first_name         = $1,
       last_name           = $2,
       full_name_bangla   = $3,
       father_name_bangla = $4,
       mother_name_bangla = $5,
       spouse_name        = $6,
       nid_number         = $7,
       blood_group        = $8,
       birth_place        = $9,
       email              = $10,
       occupation         = $11,
       employer_name      = $12,
       monthly_income     = $13,
       updated_at         = NOW() 
     WHERE application_id = $14`,
    [
      input.fullNameEnglish ?? null,
      "",                           // last_name: NOT NULL — kept empty since we store full name in first_name
      input.fullNameBangla ?? null,
      input.fatherNameBangla ?? null,
      input.motherNameBangla ?? null,
      input.spouseName ?? null,
      input.nidNumber ?? null,
      input.bloodGroup ?? null,
      input.birthPlace ?? null,
      input.email ?? null,
      input.occupation ?? null,
      input.employerName ?? null,
      input.monthlyIncome ?? null,
      input.applicationId,
    ]
  );

  await client.query(
    `INSERT INTO public.address_info (
      application_id, 
      address_line1, 
      postal_code,
      district, 
      division, 
      updated_at
     )
     VALUES ($1, $2, $3, 'Unknown', 'Unknown', NOW())
     ON CONFLICT (application_id)
     DO UPDATE SET 
       address_line1 = EXCLUDED.address_line1, 
       postal_code   = EXCLUDED.postal_code,
       updated_at    = NOW();`,
    [input.applicationId, input.presentAddress ?? null, input.postCode ?? null]
  );
},

  // 🌟 NEW: Replace all nominees for an application (delete + reinsert)
  async replaceNominees(applicationId: string, nominees: NomineeInput[], client: PoolClient): Promise<void> {
    await client.query(
      `DELETE FROM public.nominees WHERE application_id = $1`,
      [applicationId]
    );

    for (const nominee of nominees) {
      await client.query(
        `INSERT INTO public.nominees (
          application_id, name, relationship, nid_passport, date_of_birth, share_percent, contact, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          applicationId,
          nominee.name || null,
          nominee.relationship || null,
          nominee.nid || null,
          nominee.dob || null,
          parseSharePercent(nominee.share),
          nominee.contact || null,
        ]
      );
    }
  },

  // 🌟 NEW: Upsert BO account / trading settlement preferences
  async upsertBoAccount(applicationId: string, bo: BoAccountInput, client: PoolClient): Promise<void> {
    await client.query(
      `INSERT INTO public.bo_accounts (
        application_id, account_type, depository_participant, bank_name, settlement_account, tin_number,
        permission_cash, permission_margin, permission_foreign, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (application_id)
      DO UPDATE SET
        account_type           = EXCLUDED.account_type,
        depository_participant = EXCLUDED.depository_participant,
        bank_name               = EXCLUDED.bank_name,
        settlement_account      = EXCLUDED.settlement_account,
        tin_number               = EXCLUDED.tin_number,
        permission_cash          = EXCLUDED.permission_cash,
        permission_margin        = EXCLUDED.permission_margin,
        permission_foreign       = EXCLUDED.permission_foreign,
        updated_at               = NOW();`,
      [
        applicationId,
        bo.accountType || null,
        bo.dp || null,
        bo.bank || null,
        bo.settlementAccount || null,
        bo.tin || null,
        bo.cash ?? false,
        bo.margin ?? false,
        bo.foreign ?? false,
      ]
    );
  },
};