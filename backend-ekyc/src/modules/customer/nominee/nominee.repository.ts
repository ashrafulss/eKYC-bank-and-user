import type { PoolClient } from "pg";

export interface DBNomineePayload {
  name: string;
  relationship: string;
  nidPassport: string;
  dateOfBirth: string;
  sharePercent: number;
  contact: string;
  nidSkipped?: boolean | undefined;
}

export interface DBNomineeDocPayload {
  docType: "nid_front" | "nid_back";
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export const nomineeRepository = {
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

  // 🌟 PHASE 1: Saves initial ML response & images into DB
  async insertNomineeAndDocuments(
    userId: string,
    nominee: DBNomineePayload,
    documents: DBNomineeDocPayload[],
    client: PoolClient
  ) {
    const applicationId = await this.getApplicationId(userId, client);

    const nomineeResult = await client.query(
      `INSERT INTO public.nominees (
        application_id, name, relationship, nid_passport, date_of_birth, share_percent, contact, nid_skipped, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, name, relationship, nid_passport AS "nid", date_of_birth AS "dob", contact, share_percent AS "share"`,
      [
        applicationId,
        nominee.name,
        nominee.relationship,
        nominee.nidPassport,
        nominee.dateOfBirth,
        nominee.sharePercent,
        nominee.contact,
        nominee.nidSkipped ?? false
      ]
    );

    const nomineeId = nomineeResult.rows[0].id;

    for (const doc of documents) {
      await client.query(
        `INSERT INTO public.nominee_documents (
          nominee_id, doc_type, file_url, file_name, file_size, mime_type, version, is_latest, uploaded_at
         ) VALUES ($1, $2::public.nominee_document_type, $3, $4, $5, $6, 1, true, NOW())`,
        [nomineeId, doc.docType, doc.fileUrl, doc.fileName, doc.fileSize, doc.mimeType]
      );
    }

    return nomineeResult.rows[0]; // Returns everything back to send to frontend
  },

  // 🌟 PHASE 2: Updates edited values and clears older entries for this application session
  async clearAndUpsertNominees(userId: string, nomineesList: DBNomineePayload[], client: PoolClient) {
    const applicationId = await this.getApplicationId(userId, client);
    
    // Clear previously saved text configurations to avoid duplication issues on re-submit
    await client.query(`DELETE FROM public.nominees WHERE application_id = $1`, [applicationId]);

    let count = 0;
    for (const nom of nomineesList) {
      await client.query(
        `INSERT INTO public.nominees (
          application_id, name, relationship, nid_passport, date_of_birth, share_percent, contact, nid_skipped, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [applicationId, nom.name, nom.relationship, nom.nidPassport, nom.dateOfBirth, nom.sharePercent, nom.contact, nom.nidSkipped ?? false]
      );
      count++;
    }
    return count;
  },

  async advanceStepToNomineeDone(userId: string, client: PoolClient) {
    await client.query(
      `UPDATE public.users 
       SET current_step = 'nominee_done'::public.registration_step, updated_at = NOW() 
       WHERE id = $1`,
      [userId]
    );
  }
};