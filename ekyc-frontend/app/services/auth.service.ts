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
export interface SendOtpData {
  otpExpirySecond: number;
  displayMessageEN: string;
}

// 2. Define the unified structure your standard API response returns
export interface SendOtpResponse {
  success: boolean;
  message: string;
  data: SendOtpData;
}

export interface CustomerData {
  id: string;
  mobile: string;
  is_verified: boolean;
  current_step: string;
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

  sendOtp: async (payload: SendOtpPayload): Promise<SendOtpResponse> => {
    const response = await apiClient.post<SendOtpResponse>("/auth/send-otp", payload);
    return response.data; 
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