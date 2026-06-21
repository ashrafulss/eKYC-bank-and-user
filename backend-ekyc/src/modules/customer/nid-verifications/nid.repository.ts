
import type { PoolClient } from "pg";

export interface SaveDocumentPayload {
  userId: string;
  docType: "nid_front" | "nid_back";
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
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
      `INSERT INTO public.applications (user_id, updated_at) 
       VALUES ($1, NOW()) 
       RETURNING id`,
      [userId]
    );
    return appQuery.rows[0].id;
  },


  async saveNIDDocument(payload: SaveDocumentPayload, client: PoolClient) {
    const applicationId = await this.getOrCreateApplicationId(payload.userId, client);

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
        application_id, doc_type, file_url, file_name, file_size, mime_type, version, is_latest, uploaded_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
       RETURNING id, doc_type, version, is_latest`,
      [
        applicationId,
        payload.docType,
        payload.fileUrl,
        payload.fileName,
        payload.fileSize,
        payload.mimeType,
        nextVersion,
      ]
    );

    await client.query(
      `UPDATE public.users 
       SET current_step = 'nid_verified'::public.registration_step, updated_at = NOW() 
       WHERE id = $1`,
      [payload.userId]
    );

    return insertQuery.rows[0];
  },
};