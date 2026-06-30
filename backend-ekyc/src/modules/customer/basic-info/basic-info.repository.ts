import type { PoolClient } from "pg";

export interface UpdatePersonalInfoInput {
  applicationId: string;
  fullNameEnglish?: string | undefined;
  fullNameBangla?: string | undefined;
  fatherNameBangla?: string | undefined;
  motherNameBangla?: string | undefined;
  spouseName?: string | undefined;
  nidNumber?: string | undefined;
  bloodGroup?: string | undefined;
  birthPlace?: string | undefined;
  email?: string | undefined;
  occupation?: string | undefined;
  employerName?: string | undefined;
  monthlyIncome?: string | undefined;
  presentAddress?: string | undefined;
  postCode?: string | undefined;
}

export const basicInfoRepository = {
  async getNidOcrData(userId: string, client: PoolClient) {
    const query = await client.query(
      `SELECT 
        app.id as application_id,
        personal.first_name,
        personal.last_name,
        personal.full_name_bangla,
        personal.father_name_bangla,
        personal.mother_name_bangla,
        personal.date_of_birth,
        personal.gender,
        personal.mobile,
        personal.email,
        personal.occupation,
        personal.employer_name,
        personal.monthly_income,
        addr.address_line1,
        personal.nid_number,
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

    if (query.rows.length === 0) {
      return null;
    }
    return query.rows[0];
  },

  /**
   * 🌟 Saves all frontend form changes directly into structured personal and address columns
   */
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

  async updateUserWizardStep(userId: string, step: string, client: PoolClient): Promise<void> {
    await client.query(
      `UPDATE public.users SET current_step = $1::registration_step, updated_at = NOW() WHERE id = $2`,
      [step, userId]
    );
  }
};