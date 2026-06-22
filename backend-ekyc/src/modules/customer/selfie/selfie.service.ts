import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { withTransaction } from "../../../utils/withTransaction.js";
import { selfieRepository } from "./selfie.repository.js";
import { AppError } from "../../../utils/AppError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Save base64 selfie to disk ────────────────────────────────────────────────
async function saveSelfieImage(base64String: string, userId: string) {
  let mimeType: string;
  let base64Data: string;

  if (base64String.startsWith("data:")) {
    const matches = base64String.match(
      /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/
    );
    if (!matches) throw new AppError("Invalid selfie image format.", 400);
    mimeType   = matches[1]!;
    base64Data = matches[2]!;
  } else {
    mimeType   = "image/jpeg";
    base64Data = base64String;
  }

  const buffer    = Buffer.from(base64Data, "base64");
  const fileSize  = buffer.length;
  const extension = mimeType.split("/")[1] ?? "jpg";
  const uniqueId  = crypto.randomUUID();
  const fileName  = `selfie_${userId}_${uniqueId}.${extension}`;

  const uploadDir    = path.join(__dirname, "../../../uploads/selfies");
  const absolutePath = path.join(uploadDir, fileName);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  return {
    absolutePath,
    fileUrl: `/uploads/selfies/${fileName}`,
    fileName,
    fileSize,
    mimeType,
  };
}

// ── Face Match ML API ─────────────────────────────────────────────────────────
// TODO: Replace static mock with real ML call when service is ready.
// Expected response shape:
// { match_score: 87, match_pass: true, liveness_score: 92, liveness_pass: true }
async function callFaceMatchML(
  _selfieAbsolutePath: string,
  _nidFrontAbsolutePath: string,
): Promise<{
  matchScore:    number;
  matchPass:     boolean;
  livenessScore: number;
  livenessPass:  boolean;
}> {
  const ML_URL = process.env.ML_FACE_MATCH_URL;

  // ── MOCK: Remove this block and uncomment the real call below ──────────────
  if (!ML_URL) {
    console.warn("[selfie.service] ML_FACE_MATCH_URL not set — using static mock data.");
    return {
      livenessScore: 92,
      livenessPass:  true,
      matchScore:    87,
      matchPass:     true,
    };
  }
  // ── END MOCK ───────────────────────────────────────────────────────────────

  // ── REAL ML CALL (uncomment when ML service is ready) ─────────────────────
  const selfieBuffer   = await fs.readFile(_selfieAbsolutePath);
  const nidFrontBuffer = await fs.readFile(_nidFrontAbsolutePath);

  const form = new FormData();
  form.append("selfie",    new Blob([selfieBuffer],   { type: "image/jpeg" }), path.basename(_selfieAbsolutePath));
  form.append("nid_front", new Blob([nidFrontBuffer], { type: "image/jpeg" }), path.basename(_nidFrontAbsolutePath));

  const response = await fetch(`${ML_URL}/face-match`, {
    method: "POST",
    body:   form,
  });

  if (!response.ok) {
    throw new AppError(`Face match ML service error: ${response.status}`, 502);
  }

  const data = await response.json() as Record<string, unknown>;

  return {
    matchScore:    (data.match_score    as number)  ?? 0,
    matchPass:     (data.match_pass     as boolean) ?? false,
    livenessScore: (data.liveness_score as number)  ?? 75,
    livenessPass:  (data.liveness_pass  as boolean) ?? false,
  };
}

// ── Main service ──────────────────────────────────────────────────────────────
export const selfieService = {
  async processSelfie(userId: string, selfieBase64: string) {
    try {
      const selfieFile = await saveSelfieImage(selfieBase64, userId);

      return await withTransaction(async (client) => {
        const nidFrontUrl = await selfieRepository.getNIDFrontUrl(userId, client);
        console.log("[selfie.service] NID front URL:", nidFrontUrl);

        if (!nidFrontUrl) {
          throw new AppError("NID not verified yet. Please complete NID upload first.", 422);
        }

        const nidFrontAbsPath = path.join(__dirname, "../../../", nidFrontUrl);

        const mlResult = await callFaceMatchML(
          selfieFile.absolutePath,
          nidFrontAbsPath,
        );

        console.log("[selfie.service] ML result:", mlResult);

        const overallPass = mlResult.livenessPass && mlResult.matchPass;

        await selfieRepository.saveSelfieVerification(
          {
            userId,
            selfieUrl:      selfieFile.fileUrl,
            fileName:       selfieFile.fileName,
            fileSize:       selfieFile.fileSize,
            mimeType:       selfieFile.mimeType,
            livenessScore:  mlResult.livenessScore,
            livenessPass:   mlResult.livenessPass,
            faceMatchScore: mlResult.matchScore,
            faceMatchPass:  mlResult.matchPass,
            overallPass,
          },
          client,
        );

        if (overallPass) {
          await client.query(
            `UPDATE public.users
             SET current_step = 'selfie_verified'::public.registration_step,
                 updated_at = NOW()
             WHERE id = $1`,
            [userId],
          );
        }

        return {
          currentStep:    overallPass ? "selfie_verified" : "selfie_failed",
          livenessScore:  mlResult.livenessScore,
          livenessPass:   mlResult.livenessPass,
          faceMatchScore: mlResult.matchScore,
          faceMatchPass:  mlResult.matchPass,
          overallPass,
        };
      });
    } catch (err: any) {
      console.error("[selfie.service] processSelfie error:", err.message);
      throw err;
    }
  },
};