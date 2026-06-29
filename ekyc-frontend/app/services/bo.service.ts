import apiClient from "@/lib/api-client";

export interface BoDetailsPayload {
  accountType:           string;
  depositoryParticipant: string;
  bankName:              string;
  settlementAccount:     string;
  tinNumber:             string;
  permissionCash:        boolean;
  permissionMargin:      boolean;
  permissionForeign:     boolean;
}

export const boApiService = {
  async saveBoDetails(payload: BoDetailsPayload): Promise<void> {
    const response = await apiClient.post("/auth/bo-preferences", payload);
    return response.data?.data;
  },
};