import jwt, { type SignOptions } from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "secret";
const EXPIRES: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) ?? "7d";

interface JwtUserPayload {
  id: string;
  type: "user";
}

export const signUserToken = (payload: JwtUserPayload): string => {
  const options: SignOptions = { expiresIn: EXPIRES };
  return jwt.sign(payload, SECRET, options);
};

export const verifyToken = (token: string): JwtUserPayload =>
  jwt.verify(token, SECRET) as JwtUserPayload;
