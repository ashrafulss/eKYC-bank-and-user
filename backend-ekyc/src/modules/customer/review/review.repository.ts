// review.repository.ts
import type { PoolClient } from "pg";

export const reviewRepository = {
  async getFullApplicationSummary(userId: string, client: PoolClient) {
    // 1. Core structural application details with personal profile and address data
    const query = await client.query(
      `SELECT 
        app.id as application_id,
        app.status as application_status,
        
        -- Personal Profile Information columns matching your schema
        personal.first_name,
        personal.last_name,
        personal.full_name_bangla,
        personal.father_name_bangla,
        personal.mother_name_bangla,
        personal.nid_number,
        personal.date_of_birth,
        personal.gender,
        personal.mobile,
        personal.email,
        personal.occupation,
        personal.employer_name,
        personal.monthly_income,
        
        -- Address data from your production public.address_info schema
        addr.address_line1,
        addr.address_line2,
        addr.area,
        addr.district,
        addr.division,
        addr.postal_code,

        -- Fallback OCR Data payload block from NID front profile scan
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

    // 2. Query against your actual table name: public.nominees
    const nomineesQuery = await client.query(
      `SELECT name, relationship, nid_passport, date_of_birth, share_percent, contact, nid_skipped
       FROM public.nominees
       WHERE application_id = $1
       ORDER BY created_at ASC`,
      [row.application_id]
    );

    // 3. Query against your actual table name: public.bo_accounts
    const boAccountsQuery = await client.query(
      `SELECT account_type, depository_participant, bank_name, settlement_account, tin_number, permission_cash, permission_margin, permission_foreign
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
  }
};