import type { PoolClient } from "pg";

export interface UpdatePersonalInfoInput {
  applicationId: string;
  fullNameBangla: string;
  fatherNameBangla: string;
  motherNameBangla: string;
  email: string;
  occupation: string;
  employerName: string;
  monthlyIncome: string;
  presentAddress: string; // This maps directly into address_line1
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
         full_name_bangla = $1,
         father_name_bangla = $2,
         mother_name_bangla = $3,
         email = $4,
         occupation = $5,
         employer_name = $6,
         monthly_income = $7,
         updated_at = NOW() 
       WHERE application_id = $8`,
      [
        input.fullNameBangla,
        input.fatherNameBangla,
        input.motherNameBangla,
        input.email,
        input.occupation,
        input.employerName,
        input.monthlyIncome,
        input.applicationId
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