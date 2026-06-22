import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { withTransaction } from "../../../utils/withTransaction.js";
import { nomineeRepository } from "./nominee.repository.js";
import { fileURLToPath } from "url";
import { BadRequestError } from "../../../utils/AppError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface IncomingNomineeInput {
  name: string;
  relationship: string;
  nidPassport: string;
  dateOfBirth: string;
  sharePercent: number;
  contact: string;
  nidSkipped?: boolean;
  frontImage?: string | null; 
  backImage?: string | null;  
}

async function saveNomineeFile(base64String: string, userId: string, side: string) {
  const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || !matches[1] || !matches[2]) {
    throw new BadRequestError("Invalid attachment image format provided for nominee cards.");
  }
  
  const mimeType = matches[1]; 
  const base64Data = matches[2]; 
  const buffer = Buffer.from(base64Data, "base64");
  const extension = mimeType.split("/")[1] || "png";
  const uniqueId = crypto.randomUUID();
  const fileName = `nominee_${side}_${userId}_${uniqueId}.${extension}`;

  const uploadDir = path.join(__dirname, "../../../uploads/nominees");
  await fs.mkdir(uploadDir, { recursive: true });

  const absolutePath = path.join(uploadDir, fileName);
  await fs.writeFile(absolutePath, buffer);

  return {
    fileUrl: `/uploads/nominees/${fileName}`,
    fileName,
    fileSize: buffer.length,
    mimeType,
  };
}

export const nomineeService = {
  async processOcrAndSaveInitial(userId: string, frontImage: string, backImage: string) {
    return await withTransaction(async (client) => {
      const attachedDocs: any[] = [];
      const uniqueId = crypto.randomUUID();

      const frontFile = await saveNomineeFile(frontImage, userId, `front_${uniqueId}`);
      attachedDocs.push({ docType: "nid_front", ...frontFile });

      const backFile = await saveNomineeFile(backImage, userId, `back_${uniqueId}`);
      attachedDocs.push({ docType: "nid_back", ...backFile });

      const mockMlData = {
        name: "Anika Chowdhury",
        relationship: "Spouse",
        nidPassport: "5509823412",
        dateOfBirth: "1996-05-20",
        sharePercent: 100,
        contact: "",
        nidSkipped: false
      };

      const savedNominee = await nomineeRepository.insertNomineeAndDocuments(
        userId,
        mockMlData,
        attachedDocs,
        client
      );

      return savedNominee; 
    });
  },

  async processNomineeRecords(userId: string, nomineesList: IncomingNomineeInput[]) {
    const totalShares = nomineesList.reduce((sum, nom) => sum + Number(nom.sharePercent || 0), 0);
    if (totalShares <= 0 || totalShares > 100) {
      throw new BadRequestError(`Total aggregate nominee allocations must sum up between 1% and 100%. Provided: ${totalShares}%`);
    }

    return await withTransaction(async (client) => {
      const count = await nomineeRepository.clearAndUpsertNominees(userId, nomineesList, client);
      
      await nomineeRepository.advanceStepToNomineeDone(userId, client);

      return {
        currentStep: "nominee_done" as const,
        count
      };
    });
  }
};