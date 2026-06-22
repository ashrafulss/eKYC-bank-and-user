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
    // Save images directly onto disk storage locations safely
    const frontFileInfo = await saveBase64Image(frontBase64, userId, "front");
    const backFileInfo = await saveBase64Image(backBase64, userId, "back");

    // 🌟 UPDATED: Included Bangla structural mock keys derived from ML payload response
    const staticNIDData = {
      nidNumber: "5509823412",
      firstName: "Rahat",
      lastName: "Chowdhury",
      fullNameBangla: "রাহাত চৌধুরী",          // Added
      fatherNameBangla: "আহমেদ চৌধুরী",       // Added
      motherNameBangla: "বেগম চৌধুরী",         // Added
      dateOfBirth: "1994-10-15", // YYYY-MM-DD
      gender: "male" as const,
      nationality: "Bangladeshi",
      addressLine1: "House 42, Road 11, Banani",
      district: "Dhaka",
      division: "Dhaka",
      postalCode: "1213"
    };

    const frontOcrMock = {
      nid_number: staticNIDData.nidNumber,
      full_name: `${staticNIDData.firstName} ${staticNIDData.lastName}`,
      name_bn: staticNIDData.fullNameBangla,              // Kept in JSON as backup
      father_name_bn: staticNIDData.fatherNameBangla,     // Kept in JSON as backup
      mother_name_bn: staticNIDData.motherNameBangla,     // Kept in JSON as backup
      dob: staticNIDData.dateOfBirth,
      gender: staticNIDData.gender,
      raw_ocr_confidence: 98.4
    };

    const backOcrMock = {
      permanent_address: staticNIDData.addressLine1,
      district: staticNIDData.district,
      division: staticNIDData.division,
      postal_code: staticNIDData.postalCode,
      blood_group: "O+"
    };

    return await withTransaction(async (client) => {
      const documents = await nidRepository.saveNIDDocumentAndDemographics(
        {
          userId,
          docType: "nid_front",
          fileUrl: frontFileInfo.fileUrl,
          fileName: frontFileInfo.fileName,
          fileSize: frontFileInfo.fileSize,
          mimeType: frontFileInfo.mimeType,
          ocrData: frontOcrMock
        },
        {
          userId,
          docType: "nid_back",
          fileUrl: backFileInfo.fileUrl,
          fileName: backFileInfo.fileName,
          fileSize: backFileInfo.fileSize,
          mimeType: backFileInfo.mimeType,
          ocrData: backOcrMock
        },
        {
          firstName: staticNIDData.firstName,
          lastName: staticNIDData.lastName,
          fullNameBangla: staticNIDData.fullNameBangla,     // 🌟 Added to payload mapping
          fatherNameBangla: staticNIDData.fatherNameBangla, // 🌟 Added to payload mapping
          motherNameBangla: staticNIDData.motherNameBangla, // 🌟 Added to payload mapping
          dateOfBirth: staticNIDData.dateOfBirth,
          gender: staticNIDData.gender,
          nationality: staticNIDData.nationality,
          addressLine1: staticNIDData.addressLine1,
          district: staticNIDData.district,
          division: staticNIDData.division,
          postalCode: staticNIDData.postalCode
        },
        client
      );

      return {
        currentStep: "nid_verified" as const,
        documents: documents,
      };
    });
  },
};