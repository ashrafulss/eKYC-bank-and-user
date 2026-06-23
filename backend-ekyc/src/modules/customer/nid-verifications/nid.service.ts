import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { withTransaction } from "../../../utils/withTransaction.js";
import { nidRepository } from "./nid.repository.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Decodes incoming base64 payload strings and stores them safely onto application disk arrays
 */
async function saveBase64Image(base64String: string, userId: string, side: "front" | "back") {
  const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) throw new Error("Invalid image format provided.");

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

  return { fileUrl: `/uploads/nids/${fileName}`, fileName, fileSize, mimeType };
}

/**
 * Localized static OCR responses matching production response models
 */
function getMockOcrData() {
  return {
    nid_no: "5509823412",
    dob: "15/Oct/1994",
    applicant_name_eng: "Rahat Chowdhury",
    applicant_name_ben: "রাহাত চৌধুরী",
    father_name: "আহমেদ চৌধুরী",
    mother_name: "বেগম চৌধুরী",
    spouse_name: "none",
    address: "House 42, Road 11, Banani, Dhaka - 1213",
    post_code: "1213",
    blood_group: "O+",
    birth_place: "DHAKA"
  };
}

/**
 * Safely parses the mock unstructured fields and enforces a solid ISO date structure (YYYY-MM-DD)
 */
function parseOcrResponse(ocr: any) {
  const nameParts = (ocr.applicant_name_eng || "").trim().split(" ");
  const firstName = nameParts[0] || "Unknown";
  const lastName  = nameParts.slice(1).join(" ") || "Unknown";

  let dobParsed = "1994-10-15"; 
  if (ocr.dob) {
    try {
      const parts = ocr.dob.split("/");
      if (parts.length === 3) {
        // 🌟 FIXED: Added explicit type mapping Record<string, string> so it accepts dynamic lookups smoothly
        const months: Record<string, string> = {
          Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
          Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
        };
        const day = parts[0].padStart(2, "0");
        const month = months[parts[1]] || "01"; // Now safely allowed!
        const year = parts[2];
        dobParsed = `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.error("Failed parsing mock structural birth date context:", ocr.dob);
    }
  }

  const addressParts = (ocr.address || "").split(",");

  return {
    nidNumber:        ocr.nid_no || "",
    firstName,
    lastName,
    fullNameBangla:   ocr.applicant_name_ben || "",
    fatherNameBangla: ocr.father_name  || "",
    motherNameBangla: ocr.mother_name  || "",
    dateOfBirth:      dobParsed,
    gender:           "male" as const, 
    nationality:      "Bangladeshi",
    addressLine1:     addressParts[0]?.trim() || ocr.address || "",
    district:         addressParts[1]?.trim() || ocr.birth_place || "Dhaka",
    division:         addressParts[2]?.trim() || "Dhaka",
    postalCode:       ocr.post_code    || "",
  };
}

// ── Main service orchestration engine ─────────────────────────────────────────
export const nidService = {
  async processNIDUploads(userId: string, frontBase64: string, backBase64: string, userMobile: string = "0177xxxx285") {
    const frontFileInfo = await saveBase64Image(frontBase64, userId, "front");
    const backFileInfo  = await saveBase64Image(backBase64,  userId, "back");

    // 2. Load immediate static structural mock datasets
    const referenceId = crypto.randomUUID();
    const rawOcr = getMockOcrData();
    const parsed = parseOcrResponse(rawOcr);

    // 3. Normalize JSON metadata variables for logs columns matching repository layout 
    const frontOcrData = {
      nid_number:         parsed.nidNumber,
      full_name:          `${parsed.firstName} ${parsed.lastName}`,
      name_bn:            parsed.fullNameBangla,
      father_name_bn:     parsed.fatherNameBangla,
      mother_name_bn:     parsed.motherNameBangla,
      dob:                parsed.dateOfBirth,
      gender:             parsed.gender,
      raw_ocr_confidence: 98.4,
      reference_id:       referenceId,
    };

    const backOcrData = {
      permanent_address:  parsed.addressLine1,
      district:           parsed.district,
      division:           parsed.division,
      postal_code:        parsed.postalCode,
      blood_group:        rawOcr.blood_group || null,
    };

    // 4. Save information within a clean transactional database chain
    return await withTransaction(async (client) => {
      const documents = await nidRepository.saveNIDDocumentAndDemographics(
        {
          userId,
          docType:  "nid_front",
          fileUrl:  frontFileInfo.fileUrl,
          fileName: frontFileInfo.fileName,
          fileSize: frontFileInfo.fileSize,
          mimeType: frontFileInfo.mimeType,
          ocrData:  frontOcrData,
        },
        {
          userId,
          docType:  "nid_back",
          fileUrl:  backFileInfo.fileUrl,
          fileName: backFileInfo.fileName,
          fileSize: backFileInfo.fileSize,
          mimeType: backFileInfo.mimeType,
          ocrData:  backOcrData,
        },
        {
          firstName:        parsed.firstName,
          lastName:         parsed.lastName,
          fullNameBangla:   parsed.fullNameBangla,
          fatherNameBangla: parsed.fatherNameBangla,
          motherNameBangla: parsed.motherNameBangla,
          dateOfBirth:      parsed.dateOfBirth,
          gender:           parsed.gender,
          nationality:      parsed.nationality,
          addressLine1:     parsed.addressLine1,
          district:         parsed.district,
          division:         parsed.division,
          postalCode:       parsed.postalCode,
        },
        client
      );

      return {
        currentStep: "nid_verified" as const,
        documents,
      };
    });
  },
};