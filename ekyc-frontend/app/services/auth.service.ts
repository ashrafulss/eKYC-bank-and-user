import apiClient from "@/lib/api-client";

// ── TYPES ──────────────────────────────────────────────────────
export interface SendOtpPayload {
  mobile: string;
  email?: string;
  deliveryMethod: "sms" | "email" | "both";
}

export interface VerifyOtpPayload {
  mobile: string;
  otpCode: string;
}

export interface CustomerData {
  id: string;
  mobile: string;
  is_verified: boolean;
}

export interface VerifyOtpResponse {
  user: CustomerData;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const authService = {

  sendOtp: async (payload: SendOtpPayload): Promise<void> => {
    await apiClient.post("/auth/send-otp", payload);
  },

  verifyOtp: async (payload: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
    const response = await apiClient.post("/auth/verify-otp", payload);
    return response.data?.data;
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post("/auth/refresh", { refreshToken });
    return response.data?.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post("/auth/logout", { refreshToken });
  },

};