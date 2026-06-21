import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { withTransaction } from "../../../utils/withTransaction.js";
import { nidRepository } from "./nid.repository.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function saveBase64Image(base64String: string, userId: string, side: "front" | "back") {
  const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid image format provided.");
  }
  const mimeType = matches[1] as string; 
  const base64Data = matches[2] as string;
  
  const buffer = Buffer.from(base64Data, "base64");
  const fileSize = buffer.length;

  const extension = mimeType.split("/")[1] || "png";
  const uniqueId = crypto.randomUUID();
  const fileName = `nid_${side}_${userId}_${uniqueId}.${extension}`;

  const uploadDir = path.join(__dirname, "../../../uploads/nids");
  await fs.mkdir(uploadDir, { recursive: true });

  const absolutePath = path.join(uploadDir, fileName);
  await fs.writeFile(absolutePath, buffer);

  return {
    fileUrl: `/uploads/nids/${fileName}`,
    fileName,
    fileSize,
    mimeType,
  };
}

export const nidService = {
  async processNIDUploads(userId: string, frontBase64: string, backBase64: string) {

    const frontFileInfo = await saveBase64Image(frontBase64, userId, "front");
    const backFileInfo = await saveBase64Image(backBase64, userId, "back");

    return await withTransaction(async (client) => {
      
      const frontDoc = await nidRepository.saveNIDDocument({
        userId,
        docType: "nid_front", 
        fileUrl: frontFileInfo.fileUrl,
        fileName: frontFileInfo.fileName,
        fileSize: frontFileInfo.fileSize,
        mimeType: frontFileInfo.mimeType,
      }, client); 

      const backDoc = await nidRepository.saveNIDDocument({
        userId,
        docType: "nid_back",
        fileUrl: backFileInfo.fileUrl,
        fileName: backFileInfo.fileName,
        fileSize: backFileInfo.fileSize,
        mimeType: backFileInfo.mimeType,
      }, client); 

      return {
        currentStep: "nid_verified",
        documents: [frontDoc, backDoc],
      };
    });
  },
};