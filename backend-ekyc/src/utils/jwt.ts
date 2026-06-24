import jwt, { type SignOptions } from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";

const ACCESS_EXPIRES_SECONDS = 15*60; 
const REFRESH_EXPIRES_SECONDS = 24 * 60 * 60; 
export interface JwtCustomerPayload {
  id: string;
  type: "customer";
  current_step?: string;
  mobile: string;
}

export const signAccessToken = (payload: JwtCustomerPayload): string => {
  const options: SignOptions = { expiresIn: ACCESS_EXPIRES_SECONDS };
  return jwt.sign(payload, ACCESS_SECRET, options);
};

export const signRefreshToken = (payload: JwtCustomerPayload): string => {
  const options: SignOptions = { expiresIn: REFRESH_EXPIRES_SECONDS };
  return jwt.sign(payload, REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): JwtCustomerPayload =>
  jwt.verify(token, ACCESS_SECRET) as JwtCustomerPayload;

export const verifyRefreshToken = (token: string): JwtCustomerPayload =>
  jwt.verify(token, REFRESH_SECRET) as JwtCustomerPayload;
