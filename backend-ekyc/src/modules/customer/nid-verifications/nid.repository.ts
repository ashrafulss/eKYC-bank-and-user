import type { PoolClient } from "pg";

export interface SaveDocumentPayload {
  userId: string;
  docType: "nid_front" | "nid_back";
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  ocrData: Record<string, any>;
}

export interface StaticProfilePayload {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  nationality: string;
  addressLine1: string;
  district: string;
  division: string;
  postalCode: string;
}

export const nidRepository = {
  async getOrCreateApplicationId(userId: string, client: PoolClient): Promise<string> {
    const existing = await client.query(
      `SELECT id FROM public.applications WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE public.applications SET updated_at = NOW() WHERE id = $1`,
        [existing.rows[0].id]
      );
      return existing.rows[0].id;
    }

    const appQuery = await client.query(
      `INSERT INTO public.applications (user_id, status, updated_at) 
       VALUES ($1, 'pending'::public.application_status, NOW()) 
       RETURNING id`,
      [userId]
    );
    return appQuery.rows[0].id;
  },

  async saveNIDDocumentAndDemographics(
    frontPayload: Omit<SaveDocumentPayload, "ocrData"> & { ocrData: any },
    backPayload: Omit<SaveDocumentPayload, "ocrData"> & { ocrData: any },
    staticProfile: StaticProfilePayload,
    client: PoolClient
  ) {
    const applicationId = await this.getOrCreateApplicationId(frontPayload.userId, client);

    // 1. Save or Update Demographics (personal_info Table Mapping)
    await client.query(
      `INSERT INTO public.personal_info (
        application_id, first_name, last_name, date_of_birth, gender, nationality, updated_at
       ) VALUES ($1, $2, $3, $4, $5::public.biological_gender, $6, NOW())
       ON CONFLICT (application_id) DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         date_of_birth = EXCLUDED.date_of_birth,
         gender = EXCLUDED.gender,
         updated_at = NOW()`,
      [
        applicationId,
        staticProfile.firstName,
        staticProfile.lastName,
        staticProfile.dateOfBirth,
        staticProfile.gender,
        staticProfile.nationality
      ]
    );

    // 2. Save or Update Demographics Addresses (address_info Table Mapping)
    await client.query(
      `INSERT INTO public.address_info (
        application_id, address_line1, district, division, postal_code, updated_at
       ) VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (application_id) DO UPDATE SET
         address_line1 = EXCLUDED.address_line1,
         district = EXCLUDED.district,
         division = EXCLUDED.division,
         postal_code = EXCLUDED.postal_code,
         updated_at = NOW()`,
      [
        applicationId,
        staticProfile.addressLine1,
        staticProfile.district,
        staticProfile.division,
        staticProfile.postalCode
      ]
    );

    // Helper method execution context to insert individual files safely
    const insertDocumentRecord = async (payload: SaveDocumentPayload) => {
      await client.query(
        `UPDATE public.user_documents 
         SET is_latest = false 
         WHERE application_id = $1 AND doc_type = $2 AND is_latest = true`,
        [applicationId, payload.docType]
      );

      const versionQuery = await client.query(
        `SELECT COALESCE(MAX(version), 0) as max_version 
         FROM public.user_documents 
         WHERE application_id = $1 AND doc_type = $2`,
        [applicationId, payload.docType]
      );
      const nextVersion = versionQuery.rows[0].max_version + 1;

      const insertQuery = await client.query(
        `INSERT INTO public.user_documents (
          application_id, doc_type, file_url, file_name, file_size, mime_type, version, is_latest, ocr_data, uploaded_at
         ) VALUES ($1, $2::public.applicant_document_type, $3, $4, $5, $6, $7, true, $8, NOW())
         RETURNING id, doc_type, version, is_latest`,
        [
          applicationId,
          payload.docType,
          payload.fileUrl,
          payload.fileName,
          payload.fileSize,
          payload.mimeType,
          nextVersion,
          JSON.stringify(payload.ocrData)
        ]
      );
      return insertQuery.rows[0];
    };

    const frontDoc = await insertDocumentRecord(frontPayload);
    const backDoc = await insertDocumentRecord(backPayload);

    // 3. Advance state pipeline status safely
    await client.query(
      `UPDATE public.users 
       SET current_step = 'nid_verified'::public.registration_step, updated_at = NOW() 
       WHERE id = $1`,
      [frontPayload.userId]
    );

    return [frontDoc, backDoc];
  }
};