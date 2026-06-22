import apiClient from "@/lib/api-client";


export interface NomineeSubmitPayload {
  name: string;
  relationship: string;
  nidPassport: string;
  dateOfBirth: string;
  sharePercent: number;
  contact: string;
  nidSkipped: boolean;
  frontImage?: string | null;
  backImage?: string | null;
}

export const nomineeService = {

  async verifyNomineeNID(frontImage: string, backImage: string) {
    const response = await apiClient.post("/auth/verify-nominee-nid", {
      frontImage,
      backImage,
    });
    return response.data; 
  },


  async submitNominees(nominees: NomineeSubmitPayload[]) {
    const response = await apiClient.post("/auth/verify-nominee", { nominees });
    return response.data;
  },

  async saveBoPreferences(preferences: any) {
    const response = await apiClient.post("/auth/bo-preferences", preferences);
    return response.data;
  }
};