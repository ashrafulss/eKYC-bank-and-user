
import pool from "../../../config/db.js";
import { reviewRepository } from "./review.repository.js";

export const reviewService = {

  async getApplicationSummary(userId: string) {
    const client = await pool.connect();
    try {
      const summary = await reviewRepository.getFullApplicationSummary(userId, client);
      if (!summary) return null;

      const { application: app, nominees, boAccount: bo } = summary;
      const ocr = app.ocr_data || {};
      const fallbackEnglishName = `${app.first_name || ""} ${app.last_name || ""}`.trim();

      const cleanAddressParts = [
        app.address_line1,
        app.address_line2,
        app.area,
        app.district,
        app.division,
        app.postal_code ? `Postal Code: ${app.postal_code}` : ""
      ].filter(Boolean);

      const presentAddressFormatted = cleanAddressParts.length > 0
        ? cleanAddressParts.join(", ")
        : ocr.present_address || "—";

      return {
        personal: {
          fullNameEnglish: fallbackEnglishName || ocr.name_en || "—",
          fullNameBangla: app.full_name_bangla || ocr.name_bn || "—",
          dob: app.date_of_birth ? new Date(app.date_of_birth).toISOString().split("T")[0] : ocr.date_of_birth || "—",
          gender: app.gender ? app.gender.toUpperCase() : ocr.gender || "MALE",
          fatherNameBangla: app.father_name_bangla || ocr.father_name_bn || "—",
          motherNameBangla: app.mother_name_bangla || ocr.mother_name_bn || "—",
          spouseName: app.spouse_name || "—",
          nidNumber: app.nid_number || ocr.nid_no || "—",
          bloodGroup: app.blood_group || "—",
          birthPlace: app.birth_place || "—",
          email: app.email || "—",
          mobile: app.mobile || "—",
          presentAddress: presentAddressFormatted,
          postCode: app.postal_code || "—", // Mapped directly from address table column
          occupation: app.occupation || "—",
          employer: app.employer_name || "—",
          monthlyIncome: app.monthly_income || "—",
        },
        nominees: nominees.map((n: any) => ({
          name: n.name || "—",
          relationship: n.relationship || "—",
          nid: n.nid_passport || "—",
          dob: n.date_of_birth ? new Date(n.date_of_birth).toISOString().split("T")[0] : "—",
          share: n.share_percent ? `${parseFloat(n.share_percent)}%` : "—",
          contact: n.contact || "—",
        })),
        boPrefs: {
          accountType: bo?.account_type || "Individual",
          dp: bo?.depository_participant || "—",
          bank: bo?.bank_name || "—",
          settlementAccount: bo?.settlement_account || "—",
          tin: bo?.tin_number || "—",
        },
        permissions: {
          cash: bo?.permission_cash ?? true,
          margin: bo?.permission_margin ?? false,
          foreign: bo?.permission_foreign ?? false,
        }
      };
    } finally {
      client.release();
    }
  },

  async submitApplication(userId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Guard: check if user already submitted
      const currentStep = await reviewRepository.getUserCurrentStep(userId, client);
      if (!currentStep) {
        throw new Error("User not found.");
      }
      if (currentStep === "submitted") {
        throw new Error("Application already submitted.");
      }

      // Resolve applicationId from userId
      const applicationId = await reviewRepository.getApplicationIdByUserId(userId, client);
      if (!applicationId) {
        throw new Error("No active application found for this customer.");
      }

      // 1. Update applications: status = 'pending', submitted_at = NOW()
      await reviewRepository.markApplicationSubmitted(applicationId, client);

      // 2. Update users: current_step = 'submitted'
      await reviewRepository.advanceUserStepToSubmitted(userId, client);

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
};