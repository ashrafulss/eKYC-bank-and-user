import { BadRequestError } from "./AppError.js";

const VALID_DELIVERY_METHODS = ["sms", "email", "both"] as const;
export type DeliveryMethod = (typeof VALID_DELIVERY_METHODS)[number];

export function validateOtpRequest(
  mobile?: string,
  email?: string,
  deliveryMethod?: string,
): DeliveryMethod {
  if (
    !deliveryMethod ||
    !VALID_DELIVERY_METHODS.includes(deliveryMethod as DeliveryMethod)
  ) {
    throw new BadRequestError(
      "Invalid delivery method. Select 'sms', 'email', or 'both'.",
    );
  }

  const method = deliveryMethod as DeliveryMethod;

  if ((method === "sms" || method === "both") && !mobile) {
    throw new BadRequestError(
      "Mobile number is required for this delivery method",
    );
  }

  if ((method === "email" || method === "both") && !email) {
    throw new BadRequestError(
      "Email address is required for this delivery method",
    );
  }

  return method;
}
