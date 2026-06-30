import apiClient from "@/lib/api-client";


export interface ReviewApplicationData {
  personal: {
    applicationId?: string;     
    fullNameEnglish: string;
    fullNameBangla: string;
    fatherNameBangla: string;     
    motherNameBangla: string;     
    dob: string;
    gender: string;
    nidNumber: string;
    dateOfBirth: string;
    spouseName: string;
    bloodGroup: string;
    birthPlace: string;
    postCode: string;
    phoneNumber: string;
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
  fullNameEnglish?: string;
  fullNameBangla?: string;
  fatherNameBangla?: string;
  motherNameBangla?: string;
  email?: string;
  occupation?: string;
  employer?: string;
  monthlyIncome?: string;
  presentAddress?: string;
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
    await apiClient.put("/update-basic-info", payload);
  },


  async updateNominees(payload: UpdateNomineesPayload): Promise<void> {
    await apiClient.post("/nominees/update-all", payload); 
  },

  async updateBoAccounts(payload: UpdateBoAccountsPayload): Promise<void> {
    await apiClient.post("/bo-account/save", payload);
  },

  async submitApplication(): Promise<void> {
    await apiClient.post("/submit");
  },
};