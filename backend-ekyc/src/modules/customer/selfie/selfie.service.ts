import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import FormData from "form-data";
import axios from "axios";
import { withTransaction } from "../../../utils/withTransaction.js";
import { selfieRepository } from "./selfie.repository.js";
import { AppError } from "../../../utils/AppError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Save video to disk ────────────────────────────────────────────────────────
async function saveVideoFile(buffer: Buffer, userId: string) {
  const uniqueId  = crypto.randomUUID();
  const fileName  = `liveness_${userId}_${uniqueId}.mp4`;
  const uploadDir = path.join(__dirname, "../../../uploads/liveness");
  const filePath  = path.join(uploadDir, fileName);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(filePath, buffer);

  return {
    filePath,
    fileUrl:  `/uploads/liveness/${fileName}`,
    fileName,
    fileSize: buffer.length,
    mimeType: "video/mp4",
  };
}

// ── Call Liveness API ─────────────────────────────────────────────────────────
async function callLivenessAPI(
  videoBuffer: Buffer,
  videoFileName: string,
  referenceId: string,
  mobileNumber: string,
  actions: string[] = ["UP"],
): Promise<{
  livenessCheck: boolean;
  livenessScore: number;
  detectedActions: string[];
  matchedSequence: string[];
  capturedImage: string; // base64
}> {
  const LIVENESS_URL = process.env.LIVENESS_API_URL;

  if (!LIVENESS_URL) {
    console.warn("[selfie.service] LIVENESS_API_URL not set — using mock.");
    return {
      livenessCheck:   true,
      livenessScore:   92,
      detectedActions: actions,
      matchedSequence: actions,
      capturedImage:   "",
    };
  }

  const form = new FormData();
  form.append("instructions",   JSON.stringify({ actions }));
  form.append("reference_id",   referenceId);
  form.append("mobile_number",  mobileNumber);
  form.append("video",          videoBuffer, {
    filename:    videoFileName,
    contentType: "video/mp4",
  });

  const response = await axios.post(LIVENESS_URL, form, {
    headers: {
      ...form.getHeaders(),
      "x-api-key": process.env.LIVENESS_API_KEY ?? "",
    },
    timeout: 30_000,
  });

  const data = response.data;

  console.log("Liveness API response:", data);

  if (data.status !== "SUCCESS") {
    throw new AppError(data.message ?? "Liveness check failed.", 422);
  }

  return {
    livenessCheck:   data.body.livenessCheck,
    livenessScore:   data.body.livenessCheck ? 92 : 40, // mock score until API returns one
    detectedActions: data.body.detectedActions,
    matchedSequence: data.body.matchedSequence,
    capturedImage:   data.body.image ?? "",
  };
}

// ── Main service ──────────────────────────────────────────────────────────────
export const selfieService = {

  async processLiveness(
    userId: string,
    videoBuffer: Buffer,
    referenceId: string,
    mobileNumber: string,
    actions: string[],
  ) {
    const videoFile = await saveVideoFile(videoBuffer, userId);

    try {
      return await withTransaction(async (client) => {
        const livenessResult = await callLivenessAPI(
          videoBuffer,
          videoFile.fileName,
          referenceId,
          mobileNumber,
          actions,
        );

        const livenessPass  = livenessResult.livenessCheck;
        const livenessScore = livenessResult.livenessScore;
        const overallPass   = livenessPass;

        // Use the original .mp4 video as the official selfie
        let selfieUrl  = videoFile.fileUrl;
        let selfieSize = videoFile.fileSize;
        let mimeType   = "video/mp4";

        await selfieRepository.saveSelfieVerification(
          {
            userId,
            selfieUrl,
            fileName:       path.basename(selfieUrl),
            fileSize:       selfieSize,
            mimeType:       mimeType,
            livenessScore,
            livenessPass,
            faceMatchScore: 0,   // face match not in liveness API — keep 0 until ML ready
            faceMatchPass:  false,
            overallPass,
          },
          client,
        );

        return {
          livenessScore,
          livenessPass,
          faceMatchScore: null,
          faceMatchPass:  null,
          overallPass,
          capturedImage: livenessResult.capturedImage,
        };
      });
    } catch (error) {
      // Storage Leak Fix: If transaction or API fails, delete the orphaned video file
      await fs.unlink(videoFile.filePath).catch(() => {});
      throw error;
    }
  },

  async completeSelfieStep(userId: string) {
    return await withTransaction(async (client) => {
      await client.query(
        `UPDATE public.users
         SET current_step = 'selfie_verified'::public.registration_step,
             updated_at = NOW()
         WHERE id = $1`,
        [userId],
      );
      return { currentStep: "selfie_verified" };
    });
  },
};