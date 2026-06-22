import type { PoolClient } from "pg";
 
export interface SaveSelfiePayload {
  userId:         string;
  selfieUrl:      string;
  fileName:       string;
  fileSize:       number;
  mimeType:       string;
  livenessScore:  number;
  livenessPass:   boolean;
  faceMatchScore: number;
  faceMatchPass:  boolean;
  overallPass:    boolean;
}
 
export const selfieRepository = {
  // Get NID front file_url for this user (most recent, is_latest = true)
  async getNIDFrontUrl(userId: string, client: PoolClient): Promise<string | null> {
    const result = await client.query(
      `SELECT ud.file_url
       FROM public.user_documents ud
       JOIN public.applications a ON a.id = ud.application_id
       WHERE a.user_id = $1
         AND ud.doc_type = 'nid_front'
         AND ud.is_latest = true
       ORDER BY ud.uploaded_at DESC
       LIMIT 1`,
      [userId]
    );
    return result.rows[0]?.file_url ?? null;
  },
 
async saveSelfieVerification(payload: SaveSelfiePayload, client: PoolClient) {
  const app = await client.query(
    `SELECT id FROM public.applications WHERE user_id = $1 LIMIT 1`,
    [payload.userId]
  );
  if (!app.rows.length) throw new Error("Application not found.");
  const applicationId = app.rows[0].id;

  // Mark previous selfie as not latest
  await client.query(
    `UPDATE public.user_documents 
     SET is_latest = false 
     WHERE application_id = $1 AND doc_type = 'selfie' AND is_latest = true`,
    [applicationId]
  );

  // Insert into user_documents — no separate table needed
  await client.query(
    `INSERT INTO public.user_documents (
       application_id, doc_type, file_url, file_name, file_size,
       mime_type, version, is_latest, liveness_score, ocr_data, uploaded_at
     ) VALUES ($1, 'selfie', $2, $3, $4, $5, 1, true, $6, $7, NOW())`,
    [
      applicationId,
      payload.selfieUrl,
      payload.fileName,
      payload.fileSize,
      payload.mimeType,
      payload.livenessScore,
      JSON.stringify({
        liveness_pass:    payload.livenessPass,
        face_match_score: payload.faceMatchScore,
        face_match_pass:  payload.faceMatchPass,
        overall_pass:     payload.overallPass,
      }),
    ]
  );
}
};