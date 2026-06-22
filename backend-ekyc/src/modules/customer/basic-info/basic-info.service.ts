import pool from "../../../config/db.js";
import type { PrepopulatedProfileDTO } from "../../../types/basic-info.types.js";
import { basicInfoRepository } from "./basic-info.repository.js";


export const basicInfoService = {
  async getPrepopulatedProfile(userId: string): Promise<PrepopulatedProfileDTO | null> {
    const client = await pool.connect();
    try {
      const data = await basicInfoRepository.getNidOcrData(userId, client);
      if (!data) return null;
      
      const ocr = data.ocr_data || {};
      const compiledEnglishName = `${data.first_name || ""} ${data.last_name || ""}`.trim();

      return {
        applicationId: data.application_id,
        fullNameEnglish: compiledEnglishName || ocr.name_en || "",

        fullNameBangla: data.full_name_bangla || ocr.name_bn || "",
        fatherNameBangla: data.father_name_bangla || ocr.father_name_bn || "",
        motherNameBangla: data.mother_name_bangla || ocr.mother_name_bn || "",
        dob: data.date_of_birth ? new Date(data.date_of_birth).toISOString() : ocr.date_of_birth || "",
        gender: data.gender ? data.gender.toUpperCase() : ocr.gender || "MALE",
        nidNumber: data.nid_number ||  ocr.nid_no || "",
        mobile: data.mobile || "",
        presentAddress: data.raw_present_address || ocr.present_address || "",
        email: data.email || "",
        occupation: data.occupation || "", 
        employer: data.employer_name || "",   
        monthlyIncome: data.monthly_income || "Below BDT 50,000" 
      };
    } finally {
      client.release();
    }
  },

  async saveBasicProfile(userId: string, profileDto: PrepopulatedProfileDTO): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 🌟 Persist ALL fields directly into their real relational database destinations
      await basicInfoRepository.updatePersonalInfo({
        applicationId: profileDto.applicationId,
        fullNameBangla: profileDto.fullNameBangla,
        fatherNameBangla: profileDto.fatherNameBangla,
        motherNameBangla: profileDto.motherNameBangla,
        email: profileDto.email,
        occupation: profileDto.occupation,
        employerName: profileDto.employer,
        monthlyIncome: profileDto.monthlyIncome,
        presentAddress: profileDto.presentAddress
      }, client);

      // Advance wizard tracking phase status
      await basicInfoRepository.updateUserWizardStep(userId, "basic_info_done", client);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
};