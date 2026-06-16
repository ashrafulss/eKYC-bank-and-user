import { JwtCustomerPayload } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      customer?: JwtCustomerPayload;
      staff?: JwtStaffPayload;
    }
  }
}

interface JwtStaffPayload {
  id: string;
  role: "checker" | "maker" | "admin";
  type: "staff";
}
