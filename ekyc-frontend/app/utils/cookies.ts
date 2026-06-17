const isProduction = process.env.NODE_ENV === "production";
const SECURE_FLAG = isProduction ? "; Secure" : "";

export const STEP_VALUES = {
  PHONE_NUMBER_VERIFIED: "phone_number_verified",
  NID_VERIFIED: "nid_verified",
  SELFIE_VERIFIED: "selfie_verified",
  BASIC_INFO_DONE: "basic_info_done",
  NOMINEE_DONE: "nominee_done",
  REVIEW_DONE: "review_done",
  SUBMITTED: "submitted",
} as const;

export type StepValue = (typeof STEP_VALUES)[keyof typeof STEP_VALUES];

export const cookieUtil = {
  setSession(token: string): void {
    document.cookie = `next_auth_session=${token}; path=/; max-age=3600; SameSite=Strict${SECURE_FLAG}`;
  },

  setRegStep(step: StepValue): void {
    document.cookie = `reg_step=${step}; path=/; max-age=1800; SameSite=Strict${SECURE_FLAG}`;
  },

  setRefreshToken(token: string): void {
    document.cookie = `refresh_token=${token}; path=/; max-age=604800; SameSite=Strict${SECURE_FLAG}`;
  },

  clearAll(): void {
    document.cookie = "next_auth_session=; path=/; max-age=0";
    document.cookie = "reg_step=; path=/; max-age=0";
    document.cookie = "refresh_token=; path=/; max-age=0";
  },

  hasSession(): boolean {
    return document.cookie.includes("next_auth_session");
  },

  getRegStep(): StepValue | null {
    const match = document.cookie.match(/reg_step=([^;]+)/);
    return match?.[1] as StepValue ?? null;
  },

  getSession(): string | null {
    const match = document.cookie.match(/next_auth_session=([^;]+)/);
    return match?.[1] ?? null;
  },

  getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
  },

  hasValidSession(): boolean {
    return !!this.getSession();
  },
};