import apiClient from "@/lib/api-client";


export interface ReviewApplicationData {
  personal: {
    applicationId?: string;       // 🌟 Added to track references safely
    fullNameEnglish: string;
    fullNameBangla: string;
    fatherNameBangla: string;     // 🌟 Added
    motherNameBangla: string;     // 🌟 Added
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

export interface UpdateBasicProfilePayload {
  fullNameBangla: string;
  fatherNameBangla: string;
  motherNameBangla: string;
  email: string;
  occupation: string;
  employer: string;
  monthlyIncome: string;
  presentAddress: string;
}

export interface UpdateNomineesPayload {
  nominees: Array<{
    name: string;
    relationship: string;
    nid: string;
    dob: string;
    share: string; // Will parse to decimal on backend
    contact: string;
  }>;
}

export interface UpdateBoAccountsPayload {
  accountType: string;
  dp: string;
  bank: string;
  settlementAccount: string;
  tin: string;
  cash: boolean;
  margin: boolean;
  foreign: boolean;
}

export const reviewApplicationService = {
  async getSummary(): Promise<ReviewApplicationData> {
    const response = await apiClient.get<{ data: ReviewApplicationData }>("/review-summary");
    return response.data.data;
  },


  async updateBasicProfile(payload: UpdateBasicProfilePayload): Promise<void> {
    // Assuming your base apiClient handles interceptors and response text wrappers
    await apiClient.post("/basic-info", payload);
  },


  async updateNominees(payload: UpdateNomineesPayload): Promise<void> {
    await apiClient.post("/nominees/update-all", payload); 
  },

  // 🌟 NEW METHOD: Update BO profile choices and market segment rights
  async updateBoAccounts(payload: UpdateBoAccountsPayload): Promise<void> {
    await apiClient.post("/bo-account/save", payload);
  }
};