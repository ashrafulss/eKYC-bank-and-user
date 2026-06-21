import apiClient from "@/lib/api-client";

export const nidService = {

  uploadNidDocuments: async (payload: { frontImage: string; backImage: string }): Promise<any> => {
    const response = await apiClient.post("/auth/verify-nid", payload);
    return response.data?.data;
  },
};