import apiClient from "@/lib/api-client";

export interface ReviewApplicationData {
  personal: {
    fullNameEnglish: string;
    fullNameBangla: string;
    dob: string;
    gender: string;
    nidNumber: string;
    mobile: string;
    presentAddress: string;
    email: string;
    occupation: string;
    employer: string;
    monthlyIncome: string;
  };
  nominees: Array<{
    name: string;
    relationship: string;
    nid: string;
    dob: string;
    share: string;
    contact: string;
  }>;
  boPrefs: {
    accountType: string;
    dp: string;
    bank: string;
    settlementAccount: string;
    tin: string;
  };
  permissions: {
    cash: boolean;
    margin: boolean;
    foreign: boolean;
  };
}

export const reviewApplicationService = {
  async getSummary(): Promise<ReviewApplicationData> {
    const response = await apiClient.get<{ data: ReviewApplicationData }>("/review-summary");
    return response.data.data;
  }
};