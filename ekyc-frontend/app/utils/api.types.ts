export interface ApiResponse<T = any> {
  status: string;
  status_code: number;
  reference_id?: string;
  data: T; 
}

export interface SendOtpData {
  otpExpirySecond: number;
  displayMessageEN: string;
}


export type SendOtpResponse = ApiResponse<SendOtpData>;