import apiClient from "@/lib/api-client";

export interface SelfieVerificationResult {
  livenessScore:  number;
  livenessPass:   boolean;
  faceMatchScore: number | null;
  faceMatchPass:  boolean | null;
  overallPass:    boolean;
  currentStep:    string;
}

export const selfieApiService = {
  async verifySelfie(selfieBase64: string): Promise<SelfieVerificationResult> {
    const res = await apiClient.post("/auth/verify-selfie", {
      selfieImage: selfieBase64,
    });

    const data = res.data.data;

    return {
      livenessScore:  data.livenessScore,
      livenessPass:   data.livenessPass,
      faceMatchScore: data.faceMatchScore ?? null,
      faceMatchPass:  data.faceMatchPass  ?? null,
      overallPass:    data.overallPass,
      currentStep:    data.currentStep,
    };
  },


  async confirmSelfieStep() {
    const res = await apiClient.post("/auth/confirm-selfie-step");
    const data = res.data.data;
    return data;
  }
};