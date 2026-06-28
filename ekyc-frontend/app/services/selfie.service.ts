import apiClient from "@/lib/api-client";

export interface SelfieVerificationResult {
  livenessScore:  number;
  livenessPass:   boolean;
  faceMatchScore: number | null;
  faceMatchPass:  boolean | null;
  overallPass:    boolean;
  capturedImage:  string;
  currentStep?:   string;
}

export const selfieApiService = {

  async verifyLiveness(
    videoBlob: Blob,
    referenceId: string,
    mobileNumber: string,
    actions: string[] = ["UP", "DOWN", "LEFT", "RIGHT"],
  ) {
    const form = new FormData();
    form.append("video",         videoBlob, "liveness.mp4");
    form.append("reference_id",  referenceId);
    form.append("mobile_number", mobileNumber);
    form.append("actions",       JSON.stringify({ actions }));

    const res = await apiClient.post("/auth/verify-liveness", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    const responseData = res.data;
    const body = responseData.body || {};

    return {
      livenessScore:  body.livenessCheck ? 92 : 40,
      livenessPass:   !!body.livenessCheck,
      faceMatchScore: null,
      faceMatchPass:  null,
      overallPass:    !!body.livenessCheck,
      capturedImage:  body.image || "",
    } as SelfieVerificationResult;
  },


  async confirmSelfieStep() {
    const res = await apiClient.post("/auth/confirm-selfie-step");
    const data = res.data.data;
    return data;
  }
};