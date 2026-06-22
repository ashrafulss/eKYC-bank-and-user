// review.service.ts
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

      // Standardize complete mailing layout string dynamically
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
          nidNumber: app.nid_number || ocr.nid_no || "—",
          mobile: app.mobile || "—",
          presentAddress: presentAddressFormatted,
          email: app.email || "—",
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
          accountType: bo?.account_type || "Individual (Resident)",
          dp: bo?.depository_participant || "—",
          bank: bo?.bank_name || "—",
          settlementAccount: bo?.settlement_account || "—",
          tin: bo?.tin_number || "—",
        },
        permissions: {
          cash: bo?.permission_cash ?? true,
          margin: bo?.permission_margin ?? true,
          foreign: bo?.permission_foreign ?? false,
        }
      };
    } finally {
      client.release();
    }
  }
};